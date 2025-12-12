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

    // 提取所有词汇ID用于批量查询
    const vocabularyIds = [...new Set(answers.map((a: any) => a.vocabularyId))]

    // 使用事务保护整个操作
    const result = await prisma.$transaction(async (tx) => {
      // 1. 批量预查询（避免N+1查询）
      const [existingStudyPlans, existingMasteries] = await Promise.all([
        tx.study_plans.findMany({
          where: { studentId, vocabularyId: { in: vocabularyIds } },
        }),
        tx.word_masteries.findMany({
          where: { studentId, vocabularyId: { in: vocabularyIds } },
        }),
      ])

      const planMap = new Map(existingStudyPlans.map(p => [p.vocabularyId, p]))
      const masteryMap = new Map(existingMasteries.map(m => [m.vocabularyId, m]))

      // 2. 创建学习记录
      const srId = `sr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const studyRecord = await tx.study_records.create({
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
          startedAt: new Date(now.getTime() - totalTime * 1000),
          completedAt: now,
          isCompleted: true,
          updatedAt: now,
        },
      })

      // 3. 准备批量操作的数据
      const questionAnswersToCreate: any[] = []
      const dailyTaskUpdates: { studentId: string; vocabularyId: string }[] = []
      const studyPlanUpdates: any[] = []
      const masteryUpserts: any[] = []

      for (const answer of answers) {
        const { vocabularyId, questionId, answer: userAnswer, isCorrect, timeSpent } = answer

        // 3.1 准备答题记录
        questionAnswersToCreate.push({
          id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          studentId,
          vocabularyId,
          questionId,
          answer: userAnswer,
          isCorrect,
          timeSpent: timeSpent || null,
          answeredAt: now,
        })

        // 3.2 准备每日任务更新
        dailyTaskUpdates.push({ studentId, vocabularyId })

        // 3.3 准备学习计划更新
        const studyPlan = planMap.get(vocabularyId)
        if (studyPlan) {
          const newReviewCount = studyPlan.reviewCount + 1
          const nextReviewDate = calculateNextReviewDate(now, newReviewCount)
          studyPlanUpdates.push({
            id: studyPlan.id,
            reviewCount: newReviewCount,
            nextReviewAt: nextReviewDate,
          })
        }

        // 3.4 准备掌握度更新
        const existingMastery = masteryMap.get(vocabularyId)
        masteryUpserts.push({
          vocabularyId,
          isCorrect,
          existingMastery,
        })
      }

      // 4. 批量创建答题记录
      if (questionAnswersToCreate.length > 0) {
        await tx.question_answers.createMany({
          data: questionAnswersToCreate,
        })
      }

      // 5. 批量更新每日任务
      for (const { studentId: sid, vocabularyId } of dailyTaskUpdates) {
        await tx.daily_tasks.updateMany({
          where: {
            studentId: sid,
            vocabularyId,
            taskDate: { gte: today, lte: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) },
          },
          data: {
            status: 'COMPLETED',
            completedAt: now,
          },
        })
      }

      // 6. 批量更新学习计划
      for (const plan of studyPlanUpdates) {
        await tx.study_plans.update({
          where: { id: plan.id },
          data: {
            status: 'IN_PROGRESS',
            reviewCount: plan.reviewCount,
            lastReviewAt: now,
            nextReviewAt: plan.nextReviewAt,
          },
        })
      }

      // 7. 处理掌握度（需要查询最近答题记录）
      for (const item of masteryUpserts) {
        const { vocabularyId, isCorrect, existingMastery } = item

        if (!existingMastery) {
          // 创建新的掌握度记录
          await tx.word_masteries.create({
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
            ? existingMastery.totalWrongCount
            : existingMastery.totalWrongCount + 1

          const newConsecutiveCorrect = isCorrect
            ? existingMastery.consecutiveCorrect + 1
            : 0

          // 查询最近3次答题记录判定是否掌握
          const recentAnswers = await tx.question_answers.findMany({
            where: { studentId, vocabularyId },
            orderBy: { answeredAt: 'desc' },
            take: 3,
            select: { isCorrect: true },
          })

          const hasThreeRecords = recentAnswers.length >= 3
          const allCorrect = hasThreeRecords && recentAnswers.every(a => a.isCorrect)
          const newIsMastered = allCorrect

          const recentCorrectCount = recentAnswers.filter(a => a.isCorrect).length
          const newRecentAccuracy = recentAnswers.length > 0
            ? recentCorrectCount / recentAnswers.length
            : null

          const newIsDifficult = isDifficult(newTotalWrongCount)

          await tx.word_masteries.update({
            where: { id: existingMastery.id },
            data: {
              totalWrongCount: newTotalWrongCount,
              consecutiveCorrect: newConsecutiveCorrect,
              recentAccuracy: newRecentAccuracy,
              isMastered: newIsMastered,
              isDifficult: newIsDifficult,
              lastPracticeAt: now,
              updatedAt: now,
            },
          })

          // 如果已掌握，更新学习计划状态
          if (newIsMastered) {
            await tx.study_plans.updateMany({
              where: { studentId, vocabularyId },
              data: { status: 'MASTERED' },
            })
          }
        }
      }

      // 8. 处理积分系统
      const basePoints = correctCount
      const completionBonus = 5
      const perfectBonus = accuracy === 1 ? 3 : 0
      const totalPoints = basePoints + completionBonus + perfectBonus

      let studentPoints = await tx.student_points.findUnique({
        where: { studentId },
      })

      if (!studentPoints) {
        const pointsId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        studentPoints = await tx.student_points.create({
          data: {
            id: pointsId,
            studentId,
            totalPoints: 0,
            dailyPoints: 0,
            weeklyPoints: 0,
            monthlyPoints: 0,
            level: 1,
          },
        })
      }

      const newTotalPoints = studentPoints.totalPoints + totalPoints
      const newLevel = Math.floor(newTotalPoints / 100) + 1

      await tx.student_points.update({
        where: { studentId },
        data: {
          totalPoints: newTotalPoints,
          dailyPoints: studentPoints.dailyPoints + totalPoints,
          weeklyPoints: studentPoints.weeklyPoints + totalPoints,
          monthlyPoints: studentPoints.monthlyPoints + totalPoints,
          level: newLevel,
        },
      })

      // 记录积分历史
      const historyId = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      await tx.point_history.create({
        data: {
          id: historyId,
          studentId,
          points: totalPoints,
          reason: `学习${totalWords}题(对${correctCount}个+${basePoints}分, 完成+${completionBonus}分${perfectBonus > 0 ? ', 全对+' + perfectBonus + '分' : ''})`,
          relatedType: 'study_record',
          relatedId: srId,
        },
      })

      return {
        studyRecord,
        totalPoints,
        newTotalPoints,
        newLevel,
      }
    })

    // 检查并解锁成就（异步执行，不阻塞响应）
    checkAndUnlockAchievements(studentId).catch(err => {
      console.error('检查成就失败:', err)
    })

    return apiResponse.success({
      message: '答题记录已提交',
      studyRecord: result.studyRecord,
      stats: {
        totalWords,
        correctCount,
        wrongCount,
        accuracy: Math.round(accuracy * 100),
      },
      points: {
        earned: result.totalPoints,
        total: result.newTotalPoints,
        level: result.newLevel,
      },
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
