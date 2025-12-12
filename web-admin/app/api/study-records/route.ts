import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { calculateNextReviewDate, isMastered, isDifficult } from '@/lib/ebbinghaus'
import { apiResponse } from '@/lib/response'
import { checkAndUnlockAchievements } from '@/lib/achievement-checker'

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
    // 生成显式ID，避免无默认值时报错
    const srId = `sr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const studyRecord = await prisma.study_records.create({
      data: {
        id: srId,
        studentId,
        taskDate: today,
        totalWords,
        completedWords: totalWords,
        correctCount,
        wrongCount,
        accuracy,
        totalTime,
        startedAt: new Date(now.getTime() - totalTime * 1000), // 根据用时推算开始时间
        completedAt: now,
        isCompleted: true,
        updatedAt: now,
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
          taskDate: { gte: today, lte: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) },
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

      // 2.3 记录所有答题到 question_answers 表（用于计算最近3次正确率）
      await prisma.question_answers.create({
        data: {
          id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          studentId,
          vocabularyId,
          questionId,
          answer: userAnswer,
          isCorrect,
          timeSpent: timeSpent || null,
          answeredAt: now,
        },
      })

      // 2.4 记录错题
      if (!isCorrect) {
        const question = await prisma.questions.findUnique({
          where: { id: questionId },
        })

        if (question) {
          await prisma.wrong_questions.create({
            data: {
              id: `wq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
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

      // 2.5 更新单词掌握度
      let wordMastery = await prisma.word_masteries.findFirst({
        where: {
          studentId,
          vocabularyId,
        },
      })

      if (!wordMastery) {
        // 创建新的掌握度记录（显式提供id和updatedAt）
        wordMastery = await prisma.word_masteries.create({
          data: {
            id: `wm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
            studentId,
            vocabularyId,
            totalWrongCount: isCorrect ? 0 : 1,
            consecutiveCorrect: isCorrect ? 1 : 0,
            isMastered: false,
            isDifficult: false,
            lastPracticeAt: now,
            updatedAt: now,
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

        // 🔧 修复：基于最近3次答题记录判定是否掌握（必须连续3次100%正确）
        // 从 question_answers 表获取最近3次答题记录
        const recentAnswers = await prisma.question_answers.findMany({
          where: {
            studentId,
            vocabularyId,
          },
          orderBy: { answeredAt: 'desc' },
          take: 3,
          select: { isCorrect: true }
        })

        // 只有当最近3次答题都正确时才判定为掌握
        const hasThreeRecords = recentAnswers.length >= 3
        const allCorrect = hasThreeRecords && recentAnswers.every(a => a.isCorrect)
        const newIsMastered = allCorrect

        // 计算最近3次正确率
        const recentCorrectCount = recentAnswers.filter(a => a.isCorrect).length
        const newRecentAccuracy = recentAnswers.length > 0
          ? recentCorrectCount / recentAnswers.length
          : null

        const newIsDifficult = isDifficult(newTotalWrongCount)

        await prisma.word_masteries.update({
          where: { id: wordMastery.id },
          data: {
            totalWrongCount: newTotalWrongCount,
            consecutiveCorrect: newConsecutiveCorrect,
            recentAccuracy: newRecentAccuracy,  // 更新最近正确率
            isMastered: newIsMastered,
            isDifficult: newIsDifficult,
            lastPracticeAt: now,
            updatedAt: now,
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

    // 3. 🎮 添加积分奖励（游戏化）
    // 基础积分：每答对1题 +1分
    const basePoints = correctCount
    // 完成任务奖励：+5分
    const completionBonus = 5
    // 全对奖励：正确率100%额外+3分
    const perfectBonus = accuracy === 1 ? 3 : 0
    const totalPoints = basePoints + completionBonus + perfectBonus

    // 获取或创建积分记录
    let studentPoints = await prisma.student_points.findUnique({
      where: { studentId }
    })

    if (!studentPoints) {
      const pointsId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      studentPoints = await prisma.student_points.create({
        data: {
          id: pointsId,
          studentId,
          totalPoints: 0,
          dailyPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          level: 1,
          updatedAt: new Date()
        }
      })
    }

    // 更新积分
    const newTotalPoints = studentPoints.totalPoints + totalPoints
    const newLevel = Math.floor(newTotalPoints / 100) + 1

    await prisma.student_points.update({
      where: { studentId },
      data: {
        totalPoints: newTotalPoints,
        dailyPoints: studentPoints.dailyPoints + totalPoints,
        weeklyPoints: studentPoints.weeklyPoints + totalPoints,
        monthlyPoints: studentPoints.monthlyPoints + totalPoints,
        level: newLevel,
        updatedAt: new Date()
      }
    })

    // 记录积分历史
    const historyId = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    await prisma.point_history.create({
      data: {
        id: historyId,
        studentId,
        points: totalPoints,
        reason: `学习${totalWords}题(对${correctCount}个+${basePoints}分, 完成+${completionBonus}分${perfectBonus > 0 ? ', 全对+' + perfectBonus + '分' : ''})`,
        relatedType: 'study_record',
        relatedId: srId
      }
    })

    // 4. 检查并解锁成就（异步执行，不阻塞响应）
    checkAndUnlockAchievements(studentId).catch(err => {
      console.error('检查成就失败:', err)
    })

    return apiResponse.success({
      message: '答题记录已提交',
      studyRecord,
      stats: {
        totalWords,
        correctCount,
        wrongCount,
        accuracy: Math.round(accuracy * 100),
      },
      points: {
        earned: totalPoints,
        total: newTotalPoints,
        level: newLevel
      }
    })
  } catch (error: any) {
    console.error('提交答题记录失败:', error)
    return apiResponse.error(`提交答题记录失败: ${error?.message || '未知错误'}`)
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
