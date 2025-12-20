import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayBeijing, formatDateBeijing } from '@/lib/date-utils'

/**
 * 复习量预测 API
 * GET /api/review-plan/forecast?studentId=xxx&days=7
 *
 * 返回未来 N 天的复习量预测，帮助学生合理安排学习时间
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

    // 验证学生存在
    const student = await prisma.students.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    // 获取所有未掌握的学习计划
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

    const today = getTodayBeijing()
    const forecast: Array<{
      date: string
      reviewCount: number
      newReviewCount: number  // 当天新增的复习量（不含累积）
      difficulty: 'light' | 'normal' | 'heavy'
    }> = []

    // 用于追踪已计入的单词（避免重复计算累积）
    const countedWords = new Set<string>()

    for (let i = 0; i < days; i++) {
      const targetDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)

      // 统计 nextReviewAt <= targetDate 的数量（累积）
      let cumulativeCount = 0
      let newCount = 0

      for (const plan of plans) {
        if (plan.nextReviewAt && new Date(plan.nextReviewAt) <= targetDate) {
          cumulativeCount++

          // 检查是否是当天新增的
          const reviewDate = new Date(plan.nextReviewAt)
          const reviewDateStr = formatDateBeijing(reviewDate)
          const targetDateStr = formatDateBeijing(targetDate)

          if (reviewDateStr === targetDateStr && !countedWords.has(plan.vocabularyId)) {
            newCount++
            countedWords.add(plan.vocabularyId)
          }
        }
      }

      // 第一天的累积量就是新增量
      if (i === 0) {
        newCount = cumulativeCount
      }

      forecast.push({
        date: formatDateBeijing(targetDate),
        reviewCount: cumulativeCount,
        newReviewCount: newCount,
        difficulty: cumulativeCount > 300 ? 'heavy' : cumulativeCount > 150 ? 'normal' : 'light',
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
