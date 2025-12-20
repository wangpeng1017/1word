import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getDateRangeUTC } from '@/lib/date-utils'

/**
 * 获取复习计划预览（不再生成 daily_tasks，改为动态计算）
 * POST /api/review-plan/generate
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { studentId } = body

    if (!studentId) {
      return errorResponse('缺少学生ID')
    }

    const student = await prisma.students.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    const { end: endOfToday } = getDateRangeUTC()

    // 获取需要复习的词汇（status=LEARNING 且 nextReviewAt <= 今天）
    const reviewPlans = await prisma.study_plans.findMany({
      where: {
        studentId,
        status: 'LEARNING',
        nextReviewAt: { lte: endOfToday },
      },
      include: {
        vocabularies: {
          select: {
            id: true,
            word: true,
            primary_meaning: true,
          },
        },
      },
      orderBy: { nextReviewAt: 'asc' },
    })

    // 获取难点词汇用于排序
    const vocabIds = reviewPlans.map(p => p.vocabularyId)
    const difficultWords = await prisma.word_masteries.findMany({
      where: {
        studentId,
        vocabularyId: { in: vocabIds },
        isDifficult: true,
      },
      select: { vocabularyId: true },
    })
    const difficultSet = new Set(difficultWords.map(w => w.vocabularyId))

    // 难点词汇优先
    const sortedPlans = reviewPlans.sort((a, b) => {
      const aIsDifficult = difficultSet.has(a.vocabularyId) ? 1 : 0
      const bIsDifficult = difficultSet.has(b.vocabularyId) ? 1 : 0
      return bIsDifficult - aIsDifficult
    })

    return successResponse({
      totalWords: sortedPlans.length,
      words: sortedPlans.map(p => ({
        id: p.vocabularies.id,
        word: p.vocabularies.word,
        primaryMeaning: p.vocabularies.primary_meaning,
        reviewCount: p.reviewCount,
        isDifficult: difficultSet.has(p.vocabularyId),
      })),
    }, '复习计划获取成功')
  } catch (error) {
    console.error('获取复习计划错误:', error)
    return errorResponse('获取复习计划失败', 500)
  }
}
