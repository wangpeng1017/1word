import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import {
  calculateNextReviewDate,
  isMastered as checkMastered,
  isDifficult as checkDifficult,
  calculateRecentAccuracy,
} from '@/lib/ebbinghaus'

/**
 * 更新词汇掌握度
 * POST /api/review-plan/update-mastery
 * 
 * 学生每次完成答题后调用此接口更新掌握度
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
    const { studentId, vocabularyId, isCorrect, questionType } = body

    if (!studentId || !vocabularyId || typeof isCorrect !== 'boolean') {
      return errorResponse('参数不完整')
    }

    // 1. 获取或创建词汇掌握度记录
    let wordMastery = await prisma.wordMastery.findUnique({
      where: {
        studentId_vocabularyId: {
          studentId,
          vocabularyId,
        },
      },
      include: {
        vocabulary: true,
      },
    })

    if (!wordMastery) {
      // 首次练习该词汇，创建记录
      wordMastery = await prisma.wordMastery.create({
        data: {
          studentId,
          vocabularyId,
          totalWrongCount: 0,
          consecutiveCorrect: 0,
          isMastered: false,
          isDifficult: false,
        },
        include: {
          vocabulary: true,
        },
      })
    }

    // 2. 更新掌握度数据
    let newConsecutiveCorrect = wordMastery.consecutiveCorrect
    let newTotalWrongCount = wordMastery.totalWrongCount

    if (isCorrect) {
      newConsecutiveCorrect += 1
    } else {
      newConsecutiveCorrect = 0 // 答错重置连续正确次数
      newTotalWrongCount += 1
      
      // 记录错题
      await prisma.wrongQuestion.create({
        data: {
          studentId,
          vocabularyId,
          questionId: body.questionId || '', // 如果有题目ID
          wrongAnswer: body.wrongAnswer || '',
          correctAnswer: body.correctAnswer || '',
        },
      })
    }

    // 3. 判断是否掌握/是否为难点
    const mastered = checkMastered(newConsecutiveCorrect)
    const difficult = checkDifficult(newTotalWrongCount)

    // 4. 获取最近的答题记录计算正确率
    const recentWrongQuestions = await prisma.wrongQuestion.findMany({
      where: {
        studentId,
        vocabularyId,
      },
      orderBy: {
        wrongAt: 'desc',
      },
      take: 3,
    })
    
    // 构建最近3次答题记录（简化处理）
    const recentRecords: boolean[] = [isCorrect]
    const recentAccuracy = calculateRecentAccuracy(recentRecords)

    // 5. 更新词汇掌握度
    const updatedMastery = await prisma.wordMastery.update({
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
        lastPracticeAt: new Date(),
      },
    })

    // 6. 更新学习计划
    let studyPlan = await prisma.studyPlan.findUnique({
      where: {
        studentId_vocabularyId: {
          studentId,
          vocabularyId,
        },
      },
    })

    if (!studyPlan) {
      // 创建学习计划
      studyPlan = await prisma.studyPlan.create({
        data: {
          studentId,
          vocabularyId,
          status: 'IN_PROGRESS',
          reviewCount: 1,
          lastReviewAt: new Date(),
          nextReviewAt: calculateNextReviewDate(
            new Date(),
            0,
            recentAccuracy,
            wordMastery.vocabulary.difficulty as any
          ),
        },
      })
    } else {
      // 更新学习计划
      const newReviewCount = studyPlan.reviewCount + 1
      const nextReviewDate = mastered 
        ? null // 已掌握不再安排复习
        : calculateNextReviewDate(
            new Date(),
            newReviewCount,
            recentAccuracy,
            wordMastery.vocabulary.difficulty as any
          )

      await prisma.studyPlan.update({
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
