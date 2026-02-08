/**
 * @file route.ts
 * @desc 学习天数API - 基于当前激活计划获取学生学习天数和进度数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTodayBeijing, toBeijingDate, formatDateBeijing } from '@/lib/date-utils'

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

        // 2. 获取班级的活跃学习计划
        const planClass = await prisma.plan_classes.findFirst({
            where: {
                class_id: student.class_id,
                status: 'ACTIVE'
            },
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

        // 4. 艾宾浩斯记忆曲线间隔
        const REVIEW_INTERVALS = [1, 2, 4, 7, 15]

        // 5. 构建每一天的词汇包数据
        const packDays = planClass.vocabulary_packs.pack_days || []
        const dayVocabMap = new Map<number, string[]>()

        packDays.forEach(packDay => {
            const vocabIds = packDay.day_words
                .map(dw => dw.vocabularyId)
                .filter(id => !masteredVocabIds.has(id)) // 过滤已掌握
            dayVocabMap.set(packDay.dayNumber, vocabIds)
        })

        // 6. 生成 DAY 列表（复习计划模式）
        // 修正：复习计划需要延伸到学习结束后的15天（艾宾浩斯最后一个周期）
        const reviewDuration = totalDays + 15
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

            // 该天需要复习的词汇数量（基于艾宾浩斯曲线）
            let reviewWordsCount = 0
            for (const interval of REVIEW_INTERVALS) {
                const reviewTargetDay = dayNumber - interval
                if (reviewTargetDay >= 1 && reviewTargetDay <= totalDays) {
                    const reviewVocabIds = dayVocabMap.get(reviewTargetDay) || []
                    reviewWordsCount += reviewVocabIds.length
                }
            }

            // 状态判定（基于复习完成情况）
            let status = 'locked'
            let dayTotalTime = 0
            if (dayNumber < currentDayNumber) {
                if (reviewWordsCount === 0) {
                    // 该天无需复习（Day 1或纯学习天），直接标记completed
                    status = 'completed'
                } else {
                    // 查询该天是否有完成的复习记录（仅匹配 COMPLETED_REVIEW）
                    const hasReviewRecord = await prisma.study_records.findFirst({
                        where: {
                            studentId,
                            taskDate: targetDate,
                            isCompleted: true,
                            isRetestMode: false,
                            status: 'COMPLETED_REVIEW'
                        }
                    })

                    if (hasReviewRecord) {
                        status = 'completed'
                        dayTotalTime = hasReviewRecord.totalTime || 0
                    } else {
                        status = 'missed' // 未完成复习，可补卡
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
                status = 'current' // 当前天
            }

            days.push({
                day: dayNumber,
                date: dateStr,
                status,
                wordsCount: reviewWordsCount, // 复习词数（非新词数）
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

