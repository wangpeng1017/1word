import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { calculateNextReviewDate, isMastered, isDifficult } from '@/lib/ebbinghaus'
import { apiResponse } from '@/lib/response'

// POST /api/study-records - 提交答题记录
export async function POST(request: NextRequest) {
  try {
    // 验证token
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const body = await request.json()
    const {
      studentId,
      answers, // [{ vocabularyId, questionId, answer, isCorrect, timeSpent }]
    } = body

    if (!studentId || !answers || !Array.isArray(answers)) {
      return apiResponse.error('参数错误', 400)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const now = new Date()

    // 计算统计数据
    const totalWords = answers.length
    const correctCount = answers.filter((a: any) => a.isCorrect).length
    const wrongCount = totalWords - correctCount
    const accuracy = totalWords > 0 ? correctCount / totalWords : 0
    const totalTime = answers.reduce((sum: number, a: any) => sum + (a.timeSpent || 0), 0)

    // 1. 创建学习记录
    const studyRecord = await prisma.study_records.create({
      data: {
        studentId,
        taskDate: today,
        totalWords,
        completedWords: totalWords,
        correctCount,
        wrongCount,
        accuracy,
        totalTime,
        startedAt: now,
        completedAt: now,
        isCompleted: true,
      },
    })

    // 2. 处理每个单词的答题结果
    for (const answer of answers) {
      const { vocabularyId, questionId, answer: userAnswer, isCorrect, timeSpent } = answer

      // 2.1 更新每日任务状态
      await prisma.daily_tasks.updateMany({
        where: {
          studentId,
          vocabularyId,
          taskDate: today,
        },
        data: {
          status: 'COMPLETED',
          completedAt: now,
        },
      })

      // 2.2 更新学习计划
      const studyPlan = await prisma.study_plans.findFirst({
        where: {
          studentId,
          vocabularyId,
        },
      })

      if (studyPlan) {
        const newReviewCount = studyPlan.reviewCount + 1
        const nextReviewDate = calculateNextReviewDate(now, newReviewCount)

        await prisma.study_plans.update({
          where: { id: studyPlan.id },
          data: {
            status: 'IN_PROGRESS',
            reviewCount: newReviewCount,
            lastReviewAt: now,
            nextReviewAt: nextReviewDate,
          },
        })
      }

      // 2.3 记录错题
      if (!isCorrect) {
        const question = await prisma.questions.findUnique({
          where: { id: questionId },
        })

        if (question) {
          await prisma.wrong_questions.create({
            data: {
              studentId,
              vocabularyId,
              questionId,
              wrongAnswer: userAnswer,
              correctAnswer: question.correctAnswer,
              wrongAt: now,
            },
          })
        }
      }

      // 2.4 更新单词掌握度
      let wordMastery = await prisma.word_masteries.findFirst({
        where: {
          studentId,
          vocabularyId,
        },
      })

      if (!wordMastery) {
        // 创建新的掌握度记录
        wordMastery = await prisma.word_masteries.create({
          data: {
            studentId,
            vocabularyId,
            totalWrongCount: isCorrect ? 0 : 1,
            consecutiveCorrect: isCorrect ? 1 : 0,
            isMastered: false,
            isDifficult: false,
            lastPracticeAt: now,
          },
        })
      } else {
        // 更新现有掌握度记录
        const newTotalWrongCount = isCorrect 
          ? wordMastery.totalWrongCount 
          : wordMastery.totalWrongCount + 1
        
        const newConsecutiveCorrect = isCorrect 
          ? wordMastery.consecutiveCorrect + 1 
          : 0

        const newIsMastered = isMastered(newConsecutiveCorrect)
        const newIsDifficult = isDifficult(newTotalWrongCount)

        await prisma.word_masteries.update({
          where: { id: wordMastery.id },
          data: {
            totalWrongCount: newTotalWrongCount,
            consecutiveCorrect: newConsecutiveCorrect,
            isMastered: newIsMastered,
            isDifficult: newIsDifficult,
            lastPracticeAt: now,
          },
        })

        // 如果已掌握，更新学习计划状态
        if (newIsMastered) {
          await prisma.study_plans.updateMany({
            where: {
              studentId,
              vocabularyId,
            },
            data: {
              status: 'MASTERED',
            },
          })
        }
      }
    }

    return apiResponse.success({
      message: '答题记录已提交',
      studyRecord,
      stats: {
        totalWords,
        correctCount,
        wrongCount,
        accuracy: Math.round(accuracy * 100),
      },
    })
  } catch (error) {
    console.error('提交答题记录失败:', error)
    return apiResponse.error('提交答题记录失败')
  }
}

// GET /api/study-records - 获取学习记录列表
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const limit = parseInt(searchParams.get('limit') || '30')

    if (!studentId) {
      return apiResponse.error('缺少studentId参数', 400)
    }

    const records = await prisma.study_records.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return apiResponse.success(records)
  } catch (error) {
    console.error('获取学习记录失败:', error)
    return apiResponse.error('获取学习记录失败')
  }
}
