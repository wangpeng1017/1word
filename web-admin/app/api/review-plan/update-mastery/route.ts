import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import {
  calculateNextReviewDate,
  isDifficult as checkDifficult,
} from '@/lib/ebbinghaus'

/**
 * 更新词汇掌握度
 * POST /api/review-plan/update-mastery
 *
 * 学生每次完成答题后调用此接口更新掌握度
 *
 * 掌握判定逻辑（统一标准）：
 * - 基于 question_answers 表最近3条记录
 * - 只有当最近3次答题全部正确时，才判定为掌握
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
    const { studentId, vocabularyId, isCorrect, questionId, wrongAnswer, correctAnswer } = body

    if (!studentId || !vocabularyId || typeof isCorrect !== 'boolean') {
      return errorResponse('参数不完整')
    }

    const now = new Date()

    // 1. 记录答题到 question_answers 表（用于统一的掌握判定）
    if (questionId) {
      await prisma.question_answers.create({
        data: {
          id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          studentId,
          vocabularyId,
          questionId,
          answer: isCorrect ? (correctAnswer || '') : (wrongAnswer || ''),
          isCorrect,
          answeredAt: now,
        },
      })
    }

    // 2. 获取或创建词汇掌握度记录
    let wordMastery = await prisma.word_masteries.findUnique({
      where: {
        studentId_vocabularyId: {
          studentId,
          vocabularyId,
        },
      },
      include: {
        vocabularies: true,
      },
    })

    if (!wordMastery) {
      // 首次练习该词汇，创建记录
      wordMastery = await prisma.word_masteries.create({
        data: {
          id: `wm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          studentId,
          vocabularyId,
          totalWrongCount: isCorrect ? 0 : 1,
          consecutiveCorrect: isCorrect ? 1 : 0,
          isMastered: false,
          isDifficult: false,
          updatedAt: now,
        },
        include: {
          vocabularies: true,
        },
      })
    }

    // 3. 更新掌握度数据
    let newConsecutiveCorrect = wordMastery.consecutiveCorrect
    let newTotalWrongCount = wordMastery.totalWrongCount

    if (isCorrect) {
      newConsecutiveCorrect += 1
    } else {
      newConsecutiveCorrect = 0 // 答错重置连续正确次数
      newTotalWrongCount += 1

      // 记录错题
      if (questionId) {
        await prisma.wrong_questions.create({
          data: {
            id: `wq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
            studentId,
            vocabularyId,
            questionId,
            wrongAnswer: wrongAnswer || '',
            correctAnswer: correctAnswer || '',
            wrongAt: now,
          },
        })
      }
    }

    // 4. 基于 question_answers 最近3条记录判定掌握（统一标准）
    const recentAnswers = await prisma.question_answers.findMany({
      where: {
        studentId,
        vocabularyId,
      },
      orderBy: { answeredAt: 'desc' },
      take: 3,
      select: { isCorrect: true }
    })

    const hasThreeRecords = recentAnswers.length >= 3
    const allCorrect = hasThreeRecords && recentAnswers.every(a => a.isCorrect)
    const mastered = allCorrect

    // 计算最近3次正确率
    const recentCorrectCount = recentAnswers.filter(a => a.isCorrect).length
    const recentAccuracy = recentAnswers.length > 0
      ? recentCorrectCount / recentAnswers.length
      : null

    const difficult = checkDifficult(newTotalWrongCount)

    // 5. 更新词汇掌握度
    const updatedMastery = await prisma.word_masteries.update({
      where: {
        studentId_vocabularyId: {
          studentId,
          vocabularyId,
        },
      },
      data: {
        totalWrongCount: newTotalWrongCount,
        consecutiveCorrect: newConsecutiveCorrect,
        isMastered: mastered,
        isDifficult: difficult,
        recentAccuracy,
        lastPracticeAt: now,
        updatedAt: now,
      },
    })

    // 6. 更新学习计划
    let studyPlan = await prisma.study_plans.findUnique({
      where: {
        studentId_vocabularyId: {
          studentId,
          vocabularyId,
        },
      },
    })

    if (!studyPlan) {
      // 创建学习计划
      studyPlan = await prisma.study_plans.create({
        data: {
          studentId,
          vocabularyId,
          status: 'IN_PROGRESS',
          reviewCount: 1,
          lastReviewAt: new Date(),
          nextReviewAt: calculateNextReviewDate(new Date(), 0),
        },
      })
    } else {
      // 更新学习计划
      const newReviewCount = studyPlan.reviewCount + 1
      const nextReviewDate = mastered
        ? null // 已掌握不再安排复习
        : calculateNextReviewDate(new Date(), newReviewCount)

      await prisma.study_plans.update({
        where: {
          studentId_vocabularyId: {
            studentId,
            vocabularyId,
          },
        },
        data: {
          reviewCount: newReviewCount,
          lastReviewAt: new Date(),
          nextReviewAt: nextReviewDate,
          status: mastered ? 'MASTERED' : 'IN_PROGRESS',
        },
      })
    }

    return successResponse({
      mastery: updatedMastery,
      isMastered: mastered,
      isDifficult: difficult,
      nextReviewDate: mastered ? null : studyPlan.nextReviewAt,
    }, '掌握度更新成功')
  } catch (error) {
    console.error('更新掌握度错误:', error)
    return errorResponse('更新掌握度失败', 500)
  }
}
