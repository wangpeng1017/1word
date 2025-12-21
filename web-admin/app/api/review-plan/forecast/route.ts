import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayBeijing, formatDateBeijing, toBeijingDate } from '@/lib/date-utils'

/**
 * 复习量预测 API
 * GET /api/review-plan/forecast?studentId=xxx&days=7
 *
 * 返回未来 N 天的复习量预测，帮助学生合理安排学习时间
 * 包含：已学单词的复习量 + 每日新学单词量
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
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 30) // 最多预测30天

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

    // 获取所有未掌握的学习计划（用于计算复习量）
    const plans = await prisma.study_plans.findMany({
      where: {
        studentId,
        status: { not: 'MASTERED' },
      },
      select: {
        id: true,
        vocabularyId: true,
        nextReviewAt: true,
        reviewCount: true,
        status: true,
      },
    })

    // 获取已掌握的单词数量
    const masteredCount = await prisma.study_plans.count({
      where: {
        studentId,
        status: 'MASTERED',
      },
    })

    // 获取总学习单词数
    const totalLearned = await prisma.study_plans.count({
      where: { studentId },
    })

    // 获取已学过的词汇ID（用于排除新学单词）
    const learnedVocabIds = new Set(
      (await prisma.study_plans.findMany({
        where: { studentId },
        select: { vocabularyId: true },
      })).map(p => p.vocabularyId)
    )

    // 获取已掌握的词汇ID
    const masteredVocabIds = new Set(
      (await prisma.word_masteries.findMany({
        where: { studentId, isMastered: true },
        select: { vocabularyId: true },
      })).map(w => w.vocabularyId)
    )

    // 获取班级的活跃词汇库计划（用于计算每日新学单词）
    const planClass = await prisma.plan_classes.findFirst({
      where: {
        class_id: student.class_id,
        status: 'ACTIVE',
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

    // 计算词汇库计划的起始天数
    let planStartDayNumber = 0
    let totalDays = 0
    const dailyNewWordsMap = new Map<string, number>() // date -> newWordsCount

    if (planClass?.vocabulary_packs) {
      const pack = planClass.vocabulary_packs
      totalDays = pack.totalDays

      // 计算今天是学习的第几天（使用北京时间）
      const startDateBeijing = toBeijingDate(planClass.start_date)
      const diffTime = today.getTime() - startDateBeijing.getTime()
      planStartDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

      // 计算未来每天的新学单词数量
      for (let i = 0; i < days; i++) {
        const targetDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
        const targetDateStr = formatDateBeijing(targetDate)
        const dayNumber = planStartDayNumber + i

        if (dayNumber >= 1 && dayNumber <= totalDays) {
          const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
          if (packDay) {
            // 计算当天的新学单词数（排除已学和已掌握的）
            const newWordsCount = packDay.day_words.filter(dw => {
              const vocab = dw.vocabulary
              return vocab &&
                !learnedVocabIds.has(vocab.id) &&
                !masteredVocabIds.has(vocab.id) &&
                vocab.questions &&
                vocab.questions.length > 0
            }).length

            dailyNewWordsMap.set(targetDateStr, newWordsCount)
          }
        }
      }
    }

    const forecast: Array<{
      date: string
      reviewCount: number      // 总任务数（复习 + 新学）
      newWordsCount: number    // 新学单词数
      reviewWordsCount: number // 复习单词数
      difficulty: 'light' | 'normal' | 'heavy'
    }> = []

    // 用于追踪已计入的单词（避免重复计算累积）
    const countedWords = new Set<string>()

    for (let i = 0; i < days; i++) {
      const targetDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
      const targetDateStr = formatDateBeijing(targetDate)

      // 统计 nextReviewAt <= targetDate 的复习数量（累积）
      let reviewWordsCount = 0

      for (const plan of plans) {
        if (plan.nextReviewAt && new Date(plan.nextReviewAt) <= targetDate) {
          reviewWordsCount++
        }
      }

      // 获取当天的新学单词数
      const newWordsCount = dailyNewWordsMap.get(targetDateStr) || 0

      // 总任务数 = 复习数 + 新学数
      const totalCount = reviewWordsCount + newWordsCount

      forecast.push({
        date: targetDateStr,
        reviewCount: totalCount,
        newWordsCount,
        reviewWordsCount,
        difficulty: totalCount > 300 ? 'heavy' : totalCount > 150 ? 'normal' : 'light',
      })
    }

    // 计算统计摘要
    const reviewCounts = forecast.map(f => f.reviewCount)
    const avgDaily = Math.round(reviewCounts.reduce((s, c) => s + c, 0) / days)
    const peakCount = Math.max(...reviewCounts)
    const peakDay = forecast.find(f => f.reviewCount === peakCount)?.date || ''

    // 计算复习池状态
    const pendingReviewCount = plans.filter(p =>
      p.nextReviewAt && new Date(p.nextReviewAt) <= today
    ).length

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
        inReviewPool: plans.length, // 复习池中（未掌握）
        pendingToday: pendingReviewCount, // 今日待复习
        masteryRate: totalLearned > 0
          ? Math.round((masteredCount / totalLearned) * 100)
          : 0, // 掌握率
      },
    }, '复习量预测成功')
  } catch (error) {
    console.error('复习量预测错误:', error)
    return errorResponse('复习量预测失败', 500)
  }
}
