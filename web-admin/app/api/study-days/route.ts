/**
 * @file route.ts
 * @desc 学习天数API - 基于当前激活计划获取学生学习天数和进度数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTodayBeijing, toBeijingDate, formatDateBeijing } from '@/lib/date-utils'
import { getEffectiveLessons, getFullScheduleSummary, TOTAL_PLAN_DAYS } from '@/lib/review-schedule'

// GET /api/study-days?studentId=xxx - 获取学生学习天数数据（复习计划模式）
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('studentId')

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: '缺少学生ID' },
                { status: 400 }
            )
        }

        // 1. 获取学生信息和班级
        const student = await prisma.students.findUnique({
            where: { id: studentId },
            select: { id: true, class_id: true }
        })

        if (!student || !student.class_id) {
            return NextResponse.json({
                success: true,
                data: { currentDay: 0, streak: 0, totalDays: 0, days: [] }
            })
        }

        // 2. 获取班级的活跃学习计划（取已开始的最新计划，避免命中未来计划）
        const todayForPlan = getTodayBeijing()
        const planClass = await prisma.plan_classes.findFirst({
            where: {
                class_id: student.class_id,
                status: 'ACTIVE',
                start_date: { lte: todayForPlan },
            },
            orderBy: { start_date: 'desc' },
            include: {
                vocabulary_packs: {
                    include: {
                        pack_days: {
                            include: {
                                day_words: {
                                    select: {
                                        vocabularyId: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!planClass || !planClass.vocabulary_packs) {
            return NextResponse.json({
                success: true,
                data: { currentDay: 0, streak: 0, totalDays: 0, days: [] }
            })
        }

        const totalDays = planClass.vocabulary_packs.totalDays || 10
        const startDate = new Date(planClass.start_date)
        const today = formatDateBeijing(new Date())

        // 计算当前是计划的第几天
        const startDateBeijing = toBeijingDate(planClass.start_date)
        const todayBeijing = getTodayBeijing()
        const diffTime = todayBeijing.getTime() - startDateBeijing.getTime()
        const currentDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

        // 3. 获取已掌握的词汇ID（全局过滤）
        const masteredWords = await prisma.word_masteries.findMany({
            where: { studentId, isMastered: true },
            select: { vocabularyId: true }
        })
        const masteredVocabIds = new Set(masteredWords.map(w => w.vocabularyId))

        // 4. 构建课表摘要（91天）
        // 5. 构建每一天的词汇包数据
        const packDays = planClass.vocabulary_packs.pack_days || []
        const dayVocabMap = new Map<number, string[]>()

        packDays.forEach(packDay => {
            const vocabIds = packDay.day_words
                .map(dw => dw.vocabularyId)
                .filter(id => !masteredVocabIds.has(id)) // 过滤已掌握
            dayVocabMap.set(packDay.dayNumber, vocabIds)
        })

        // 6. 一次性批量查询所有复习完成记录（避免 N+1 查询）
        // 原来在循环内每天查一次DB，200学生×25天=5000次查询
        // 改为只查1次，在内存中匹配
        const allReviewRecords = await prisma.study_records.findMany({
            where: {
                studentId,
                isCompleted: true,
                isRetestMode: false,
                status: 'COMPLETED_REVIEW', // 只匹配复习完成状态，排除 COMPLETED/COMPLETED_NEW（今日学习/mode=unknown）
                taskDate: {
                    gte: startDate,
                },
            },
            select: {
                taskDate: true,
                totalTime: true,
                totalWords: true,
            },
        })

        // 按日期建立索引（用日期字符串作为 key）
        const reviewRecordMap = new Map<string, { totalTime: number; totalWords: number }>()
        for (const record of allReviewRecords) {
            const dateKey = formatDateBeijing(record.taskDate)
            reviewRecordMap.set(dateKey, { totalTime: record.totalTime || 0, totalWords: record.totalWords || 0 })
        }

        // 7. 查询补卡完成记录（通过 sessionId 中的 day 标签匹配）
        // 补卡的 taskDate 是补卡当天（不是目标 Day 的日期），所以无法用日期匹配
        // 只能通过 sessionId 中的 _d{dayNumber}_ 标签来识别
        const makeupRecords = await prisma.study_records.findMany({
            where: {
                studentId,
                isCompleted: true,
                isRetestMode: false,
                status: { in: ['COMPLETED_NEW', 'COMPLETED'] },
                id: { contains: '_d' }, // sessionId 含 day 标签
                NOT: { id: { contains: '_dnull' } }, // 排除正常今日新学（day=null）
            },
            select: { id: true, totalWords: true },
        })
        // 从 sessionId 中提取 day 编号，建立补卡完成 Map（存储实际词数）
        const makeupCompletedDays = new Map<number, number>()
        for (const r of makeupRecords) {
            const match = r.id.match(/_d(\d+)/)
            if (match) makeupCompletedDays.set(parseInt(match[1]), r.totalWords || 0)
        }

        // 8. 生成 DAY 列表（91天复习课表模式）
        const lessonMap = getEffectiveLessons(packDays)
        const totalLessons = lessonMap.size
        const scheduleSummary = getFullScheduleSummary(totalDays, totalLessons, lessonMap)
        const reviewDuration = TOTAL_PLAN_DAYS
        const days = []
        let streak = 0
        let lastCompletedDate: string | null = null

        for (let i = 0; i < reviewDuration; i++) {
            const dayNumber = i + 1
            const targetDate = new Date(startDate)
            targetDate.setDate(targetDate.getDate() + i)
            const dateStr = formatDateBeijing(targetDate)

            // 该天的新词数量（学习计划）
            const newWordsCount = dayVocabMap.get(dayNumber)?.length || 0

            // 该天需要复习的词汇数量（基于课表引擎）
            let reviewWordsCount = 0
            const scheduleEntry = scheduleSummary[i] // 0-indexed
            if (scheduleEntry) {
                for (const reviewDayNum of scheduleEntry.reviewDayNumbers) {
                    const reviewVocabIds = dayVocabMap.get(reviewDayNum) || []
                    reviewWordsCount += reviewVocabIds.length
                }
            }

            // 状态判定（基于复习完成情况 + 补卡完成情况）
            let status = 'locked'
            let dayTotalTime = 0
            if (dayNumber < currentDayNumber) {
                if (reviewWordsCount === 0) {
                    // 该天无需复习（Day 1或纯学习天），直接标记completed
                    status = 'completed'
                } else {
                    // 从批量查询结果中查找（内存操作，无 DB 查询）
                    const reviewRecord = reviewRecordMap.get(dateStr)

                    if (reviewRecord || makeupCompletedDays.has(dayNumber)) {
                        // 正常复习完成 或 补卡完成 → 星星
                        status = 'completed'
                        dayTotalTime = reviewRecord?.totalTime || 0
                        // 使用实际完成词数覆盖理论值
                        if (reviewRecord) {
                            reviewWordsCount = reviewRecord.totalWords
                        } else if (makeupCompletedDays.has(dayNumber)) {
                            reviewWordsCount = makeupCompletedDays.get(dayNumber)!
                        }
                    } else {
                        // 没有新词可补的 missed Day 自动完成（复习词会被后续天数的艾宾浩斯间隔覆盖）
                        status = newWordsCount > 0 ? 'missed' : 'completed'
                    }
                }

                // 计算连续天数
                if (status === 'completed') {
                    if (!lastCompletedDate) {
                        streak = 1
                    } else {
                        const lastDate = new Date(lastCompletedDate)
                        const currentDate = new Date(dateStr)
                        const diff = (currentDate.getTime() - lastDate.getTime()) / 86400000
                        if (diff === 1) {
                            streak++
                        } else {
                            streak = 1
                        }
                    }
                    lastCompletedDate = dateStr
                }
            } else if (dayNumber === currentDayNumber) {
                // 当前天也检查是否已完成复习
                if (reviewWordsCount > 0) {
                    const reviewRecord = reviewRecordMap.get(dateStr)
                    if (reviewRecord) {
                        status = 'completed'
                        dayTotalTime = reviewRecord.totalTime
                        reviewWordsCount = reviewRecord.totalWords // 使用实际完成词数
                    } else {
                        status = 'current'
                    }
                } else {
                    status = 'current'
                }
            }

            days.push({
                day: dayNumber,
                date: dateStr,
                status,
                wordsCount: reviewWordsCount, // 复习词数（非新词数）
                newWordsCount, // 新词数（用于前端判断Day1等入口）
                accuracy: 0, // 复习模式下暂不显示准确率
                totalTime: dayTotalTime, // 从study_records获取实际用时
            })
        }

        // 找到当前天数
        const currentDayIndex = days.findIndex(d => d.status === 'current' || d.status === 'locked')

        return NextResponse.json({
            success: true,
            data: {
                currentDay: currentDayIndex >= 0 ? currentDayIndex + 1 : days.length,
                streak,
                totalDays,
                packName: planClass.vocabulary_packs?.name || '',
                startDate: startDate.toISOString().split('T')[0],
                days,
            },
        })
    } catch (error) {
        console.error('[API] 获取学习天数失败:', error)
        return NextResponse.json(
            { success: false, error: '获取学习天数失败' },
            { status: 500 }
        )
    }
}

