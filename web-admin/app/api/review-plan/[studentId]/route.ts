import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayDate } from '@/lib/ebbinghaus'
import { getDateRangeUTC, getTodayBeijing, toBeijingDate } from '@/lib/date-utils'

// 艾宾浩斯记忆曲线：第N天学的单词，在第N+1, N+2, N+4, N+7, N+15天复习
const REVIEW_INTERVALS = [1, 2, 4, 7, 15]

/**
 * 获取学生的复习计划和学习进度
 * GET /api/review-plan/[studentId]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { studentId } = params

    // 1. 获取学生信息
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        classes: { select: { id: true, name: true } },
      },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    const { start: startOfToday, end: endOfToday } = getDateRangeUTC()

    // 2. 获取学习计划统计（用于总体进度显示）
    const studyPlans = await prisma.study_plans.findMany({
      where: { studentId },
    })

    const totalWords = studyPlans.length
    const masteredWords = studyPlans.filter(p => p.status === 'MASTERED').length
    const learningWords = studyPlans.filter(p => p.status === 'LEARNING').length

    // 3. 获取掌握度统计
    const wordMasteries = await prisma.word_masteries.findMany({
      where: { studentId },
    })

    const masteredVocabIds = new Set(
      wordMasteries.filter(m => m.isMastered).map(m => m.vocabularyId)
    )

    const difficultWords = wordMasteries.filter(m => m.isDifficult).length
    const avgAccuracy = wordMasteries.length > 0
      ? wordMasteries.reduce((sum, m) => sum + (m.recentAccuracy || 0), 0) / wordMasteries.length
      : 0

    // 4. 获取最近7天的学习记录
    const targetDate = getTodayDate()
    const sevenDaysAgo = new Date(targetDate)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentStudyRecords = await prisma.study_records.findMany({
      where: {
        studentId,
        taskDate: { gte: sevenDaysAgo, lte: targetDate },
      },
      orderBy: { taskDate: 'asc' },
    })

    // 5. 获取连续学习天数
    let consecutiveDays = 0
    const studyStreak = await prisma.study_streaks.findUnique({
      where: { studentId },
    })

    if (studyStreak) {
      const lastStudy = studyStreak.lastStudyDate
      const today = getTodayDate()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastStudy) {
        const lastStudyStr = new Date(lastStudy).toDateString()
        if (lastStudyStr === today.toDateString() || lastStudyStr === yesterday.toDateString()) {
          consecutiveDays = studyStreak.currentStreak
        }
      }
    }

    // 6. 使用艾宾浩斯记忆曲线计算今日任务数（与 daily-tasks API 保持一致）
    let todayNewCount = 0
    let todayReviewCount = 0

    if (student.classes?.id) {
      const planClass = await prisma.plan_classes.findFirst({
        where: {
          class_id: student.classes.id,
          status: 'ACTIVE'
        },
        include: {
          vocabulary_packs: {
            include: {
              pack_days: {
                include: {
                  day_words: {
                    include: {
                      vocabulary: {
                        select: {
                          id: true,
                          questions: { select: { id: true } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (planClass?.vocabulary_packs) {
        const pack = planClass.vocabulary_packs
        const today = getTodayBeijing()
        const startDateBeijing = toBeijingDate(planClass.start_date)
        const diffTime = today.getTime() - startDateBeijing.getTime()
        const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

        // 计算今日新学单词数
        if (dayNumber >= 1 && dayNumber <= pack.totalDays) {
          const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
          if (packDay) {
            const newWords = packDay.day_words
              .filter(dw => dw.vocabulary && !masteredVocabIds.has(dw.vocabulary.id))
              .filter(dw => dw.vocabulary.questions && dw.vocabulary.questions.length > 0)
            todayNewCount = newWords.length
          }
        }

        // 计算今日复习单词数（基于艾宾浩斯记忆曲线）
        const newWordIds = new Set<string>()
        if (dayNumber >= 1 && dayNumber <= pack.totalDays) {
          const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
          if (packDay) {
            packDay.day_words.forEach(dw => {
              if (dw.vocabulary) newWordIds.add(dw.vocabulary.id)
            })
          }
        }

        const seenVocabIds = new Set<string>()
        for (const interval of REVIEW_INTERVALS) {
          const targetDay = dayNumber - interval
          if (targetDay >= 1 && targetDay <= pack.totalDays) {
            const packDay = pack.pack_days.find(d => d.dayNumber === targetDay)
            if (packDay) {
              const dayReviewWords = packDay.day_words
                .filter(dw => dw.vocabulary &&
                  !masteredVocabIds.has(dw.vocabulary.id) &&
                  !newWordIds.has(dw.vocabulary.id) &&
                  !seenVocabIds.has(dw.vocabulary.id))
                .filter(dw => dw.vocabulary.questions && dw.vocabulary.questions.length > 0)

              dayReviewWords.forEach(dw => {
                seenVocabIds.add(dw.vocabulary.id)
              })
              todayReviewCount += dayReviewWords.length
            }
          }
        }
      }
    }

    // 7. 获取今日已完成数量
    const todayRecord = await prisma.study_records.findFirst({
      where: {
        studentId,
        taskDate: { gte: startOfToday, lte: endOfToday }
      }
    })

    // dueCount: 今日应完成的总任务数 = 新学 + 复习
    const todayDueCount = todayNewCount + todayReviewCount
    const todayCompletedCount = todayRecord?.completedWords || 0
    const todayTimeSpent = todayRecord?.totalTime || 0

    // 需要复习的词汇数量（用于后台显示）
    const needReview = todayReviewCount

    return successResponse({
      student: {
        id: student.id,
        name: student.user.name,
        studentNo: student.student_no,
        className: student.classes?.name || '-',
      },
      progress: {
        totalWords,
        masteredWords,
        learningWords,
        needReview,
        difficultWords,
        masteryRate: totalWords > 0 ? Number(((masteredWords / totalWords) * 100).toFixed(1)) : 0,
        avgAccuracy: Number((avgAccuracy * 100).toFixed(1)),
        consecutiveDays,
      },
      recentActivity: recentStudyRecords.map(r => ({
        date: r.taskDate,
        completed: r.completedWords,
        total: r.totalWords,
        accuracy: Number((r.accuracy * 100).toFixed(1)),
        timeSpent: r.totalTime,
      })),
      // 小程序兼容字段
      miniapp: {
        today: {
          dueCount: todayDueCount,
          completedCount: todayCompletedCount,
          timeSpentSeconds: todayTimeSpent,
          newCount: todayNewCount,
          reviewCount: todayReviewCount,
        },
        progress: {
          consecutiveDays,
        }
      }
    })
  } catch (error) {
    console.error('获取复习计划错误:', error)
    return errorResponse('获取复习计划失败', 500)
  }
}
