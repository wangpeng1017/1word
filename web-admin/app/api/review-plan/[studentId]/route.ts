import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayDate } from '@/lib/ebbinghaus'
import { getDateRangeUTC, getTodayBeijing, toBeijingDate } from '@/lib/date-utils'

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
        classes: { select: { id: true, name: true, grade: true } },
      },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    const { start: startOfToday, end: endOfToday } = getDateRangeUTC()

    // 2. 获取学习计划统计
    const studyPlans = await prisma.study_plans.findMany({
      where: { studentId },
    })

    const totalWords = studyPlans.length
    const masteredWords = studyPlans.filter(p => p.status === 'MASTERED').length
    const learningWords = studyPlans.filter(p => p.status === 'LEARNING').length

    // 3. 获取需要复习的词汇数量
    const needReview = await prisma.study_plans.count({
      where: {
        studentId,
        status: 'LEARNING',
        nextReviewAt: { lte: endOfToday },
      },
    })

    // 4. 获取掌握度统计
    const wordMasteries = await prisma.word_masteries.findMany({
      where: { studentId },
    })

    const difficultWords = wordMasteries.filter(m => m.isDifficult).length
    const avgAccuracy = wordMasteries.length > 0
      ? wordMasteries.reduce((sum, m) => sum + (m.recentAccuracy || 0), 0) / wordMasteries.length
      : 0

    // 5. 获取最近7天的学习记录
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

    // 6. 获取连续学习天数
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

    // 7. 计算今日任务数（新词 + 复习词）- 用于小程序
    let todayNewCount = 0
    let todayReviewCount = needReview

    // 获取班级的活跃词汇库计划
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
                  day_words: { select: { vocabularyId: true } }
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

        if (dayNumber >= 1 && dayNumber <= pack.totalDays) {
          const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
          if (packDay) {
            // 获取已掌握的词汇ID
            const masteredVocabIds = new Set(
              wordMasteries.filter(m => m.isMastered).map(m => m.vocabularyId)
            )
            // 获取已学习的词汇ID
            const learnedVocabIds = new Set(studyPlans.map(p => p.vocabularyId))

            // 计算新词数（排除已掌握和已学习的）
            const dayVocabIds = packDay.day_words.map(dw => dw.vocabularyId)

            // 检查这些词汇是否有题目
            const vocabsWithQuestions = await prisma.vocabularies.findMany({
              where: {
                id: { in: dayVocabIds },
                questions: { some: {} }
              },
              select: { id: true }
            })
            const vocabIdsWithQuestions = new Set(vocabsWithQuestions.map(v => v.id))

            todayNewCount = dayVocabIds.filter(id =>
              !masteredVocabIds.has(id) &&
              !learnedVocabIds.has(id) &&
              vocabIdsWithQuestions.has(id)
            ).length
          }
        }
      }
    }

    // 8. 获取今日已完成数量
    const todayRecord = await prisma.study_records.findFirst({
      where: {
        studentId,
        taskDate: { gte: startOfToday, lte: endOfToday }
      }
    })

    const todayDueCount = todayNewCount + todayReviewCount
    const todayCompletedCount = todayRecord?.completedWords || 0
    const todayTimeSpent = todayRecord?.totalTime || 0

    return successResponse({
      student: {
        id: student.id,
        name: student.user.name,
        studentNo: student.student_no,
        grade: student.grade,
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
        }
      }
    })
  } catch (error) {
    console.error('获取复习计划错误:', error)
    return errorResponse('获取复习计划失败', 500)
  }
}
