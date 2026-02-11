import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayBeijing, formatDateBeijing, toBeijingDate } from '@/lib/date-utils'

// 艾宾浩斯复习间隔：学习后第N天需要复习（绝对天数模式）
const REVIEW_DAYS_FROM_LEARNING = [1, 2, 4, 7, 15]

/**
 * 复习量预测 API
 * GET /api/review-plan/forecast?studentId=xxx&days=7
 *
 * 返回未来 N 天的复习量预测，帮助学生合理安排学习时间
 * 采用绝对天数模式：学习后第1、2、4、7、15天需要复习
 * 无论学生是否完成学习，计划中的单词都按计划日期的记忆曲线安排复习
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 60) // 最多预测60天

    if (!studentId) {
      return errorResponse('缺少学生ID')
    }

    // 验证学生存在并获取班级信息
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: { id: true, class_id: true },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    // 获取已掌握的词汇ID（这些不需要再学习/复习）
    const masteredVocabIds = new Set(
      (await prisma.word_masteries.findMany({
        where: { studentId, isMastered: true },
        select: { vocabularyId: true },
      })).map(w => w.vocabularyId)
    )

    // 获取已掌握的单词数量
    const masteredCount = masteredVocabIds.size

    // 获取总学习单词数
    const totalLearned = await prisma.study_plans.count({
      where: { studentId },
    })

    // 获取班级的活跃词汇库计划（取已开始的最新计划，避免命中未来计划）
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
                  include: {
                    vocabulary: {
                      select: {
                        id: true,
                        questions: { select: { id: true } },
                      },
                    },
                  },
                },
              },
              orderBy: { dayNumber: 'asc' },
            },
          },
        },
      },
    })

    const today = getTodayBeijing()

    // 建立每日计划词汇数Map（基于词汇库计划日期，不受学生是否完成影响）
    const dailyPlanWords = new Map<string, number>() // date -> wordsCount

    if (planClass?.vocabulary_packs) {
      const pack = planClass.vocabulary_packs
      const planStartDate = toBeijingDate(planClass.start_date)

      // 遍历词汇库的每一天，计算每天计划的词汇数
      for (const packDay of pack.pack_days) {
        // 计划日期 = 开始日期 + (dayNumber - 1) 天
        const planDate = new Date(planStartDate.getTime() + (packDay.dayNumber - 1) * 24 * 60 * 60 * 1000)
        const planDateStr = formatDateBeijing(planDate)

        // 计算当天计划的有效词汇数（排除已掌握的）
        const wordsCount = packDay.day_words.filter(dw => {
          const vocab = dw.vocabulary
          return vocab &&
            !masteredVocabIds.has(vocab.id) &&
            vocab.questions &&
            vocab.questions.length > 0
        }).length

        dailyPlanWords.set(planDateStr, wordsCount)
      }
    }

    const forecast: Array<{
      date: string
      reviewCount: number      // 总任务数（复习 + 新学）
      newWordsCount: number    // 新学单词数
      reviewWordsCount: number // 复习单词数
      difficulty: 'light' | 'normal' | 'heavy'
      reviewSources?: string[] // 复习来源（可选，用于调试）
    }> = []

    // 计算每天的复习量（基于绝对天数模式）
    for (let i = 0; i < days; i++) {
      const targetDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
      const targetDateStr = formatDateBeijing(targetDate)

      // 计算当天的复习量（基于计划日期的词汇）
      let reviewWordsCount = 0
      const reviewSources: string[] = []

      // 检查每个复习间隔
      for (const reviewDay of REVIEW_DAYS_FROM_LEARNING) {
        // 需要在 targetDate 做第N天复习的，是在 targetDate - reviewDay 天计划学习的
        const learnDate = new Date(targetDate.getTime() - reviewDay * 24 * 60 * 60 * 1000)
        const learnDateStr = formatDateBeijing(learnDate)

        // 使用计划的词汇数（不受是否完成影响）
        const wordsPlanedThatDay = dailyPlanWords.get(learnDateStr) || 0

        if (wordsPlanedThatDay > 0) {
          reviewWordsCount += wordsPlanedThatDay
          // 简化来源信息，只保留日期和天数
          reviewSources.push(`${learnDateStr.slice(5)}(${wordsPlanedThatDay}词,第${reviewDay}天)`)
        }
      }

      // 获取当天的新学单词数（基于计划）
      const newWordsCount = dailyPlanWords.get(targetDateStr) || 0

      // 总任务数 = 复习数 + 新学数
      const totalCount = reviewWordsCount + newWordsCount

      forecast.push({
        date: targetDateStr,
        reviewCount: totalCount,
        newWordsCount,
        reviewWordsCount,
        difficulty: totalCount > 30 ? 'heavy' : totalCount > 15 ? 'normal' : 'light',
        reviewSources: reviewSources.length > 0 ? reviewSources : undefined,
      })
    }

    // 计算统计摘要
    const reviewCounts = forecast.map(f => f.reviewCount)
    const avgDaily = Math.round(reviewCounts.reduce((s, c) => s + c, 0) / days)
    const peakCount = Math.max(...reviewCounts)
    const peakDay = forecast.find(f => f.reviewCount === peakCount)?.date || ''

    // 获取未掌握的学习计划数量
    const inReviewPoolCount = await prisma.study_plans.count({
      where: {
        studentId,
        status: { not: 'MASTERED' },
      },
    })

    // 计算今日待复习（基于实际的study_plans.nextReviewAt）
    const pendingReviewCount = await prisma.study_plans.count({
      where: {
        studentId,
        status: { not: 'MASTERED' },
        nextReviewAt: { lte: today },
      },
    })

    return successResponse({
      forecast,
      summary: {
        avgDaily,
        peakDay,
        peakCount,
      },
      pool: {
        totalLearned,           // 总学习词数
        mastered: masteredCount, // 已掌握
        inReviewPool: inReviewPoolCount, // 复习池中（未掌握）
        pendingToday: pendingReviewCount, // 今日待复习
        masteryRate: totalLearned > 0
          ? Math.round((masteredCount / totalLearned) * 100)
          : 0, // 掌握率
      },
      algorithm: {
        mode: 'absolute_days', // 绝对天数模式
        reviewDays: REVIEW_DAYS_FROM_LEARNING, // 复习间隔
      },
    }, '复习量预测成功')
  } catch (error) {
    console.error('复习量预测错误:', error)
    return errorResponse('复习量预测失败', 500)
  }
}
