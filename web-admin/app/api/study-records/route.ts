import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { calculateNextReviewDate, isDifficult } from '@/lib/ebbinghaus'
import { apiResponse } from '@/lib/response'
import { checkAndUnlockAchievements } from '@/lib/achievement-checker'
import { getTodayUTC } from '@/lib/date-utils'

// 同步更新掌握度
async function updateMasteries(
  studentId: string,
  answers: any[],
  masteryMap: Map<string, any>,
  now: Date
) {
  try {
    const vocabularyIds = [...new Set(answers.map(a => a.vocabularyId))]

    const recentAnswers = await prisma.question_answers.findMany({
      where: { studentId, vocabularyId: { in: vocabularyIds } },
      orderBy: { answeredAt: 'desc' },
      select: { vocabularyId: true, isCorrect: true },
    })

    const answersByVocab = new Map<string, boolean[]>()
    for (const a of recentAnswers) {
      const list = answersByVocab.get(a.vocabularyId) || []
      if (list.length < 3) {
        list.push(a.isCorrect)
        answersByVocab.set(a.vocabularyId, list)
      }
    }

    const updates = answers.map(a => {
      const existing = masteryMap.get(a.vocabularyId)
      const recent = answersByVocab.get(a.vocabularyId) || []
      const isMastered = recent.length >= 3 && recent.every(r => r)

      if (!existing) {
        return prisma.word_masteries.create({
          data: {
            id: `wm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            studentId,
            vocabularyId: a.vocabularyId,
            totalWrongCount: a.isCorrect ? 0 : 1,
            consecutiveCorrect: a.isCorrect ? 1 : 0,
            isMastered,
            isDifficult: false,
            lastPracticeAt: now,
            updatedAt: now,
          }
        })
      } else {
        const newWrongCount = a.isCorrect ? existing.totalWrongCount : existing.totalWrongCount + 1
        return prisma.word_masteries.update({
          where: { id: existing.id },
          data: {
            totalWrongCount: newWrongCount,
            consecutiveCorrect: a.isCorrect ? existing.consecutiveCorrect + 1 : 0,
            isMastered,
            isDifficult: isDifficult(newWrongCount),
            recentAccuracy: a.isCorrect ? Math.min(1, (existing.recentAccuracy || 0) + 0.1) : Math.max(0, (existing.recentAccuracy || 0) - 0.2),
            lastPracticeAt: now,
            updatedAt: now,
          }
        })
      }
    })

    await Promise.all(updates)

    // 更新已掌握词汇的 study_plans 状态
    const masteredVocabIds = answers
      .filter(a => {
        const recent = answersByVocab.get(a.vocabularyId) || []
        return recent.length >= 3 && recent.every(r => r)
      })
      .map(a => a.vocabularyId)

    if (masteredVocabIds.length > 0) {
      await prisma.study_plans.updateMany({
        where: { studentId, vocabularyId: { in: masteredVocabIds } },
        data: { status: 'MASTERED', updatedAt: now },
      })
    }

    return masteredVocabIds
  } catch (err) {
    console.error('更新掌握度失败:', err)
    throw err
  }
}

// 异步更新积分
async function updatePointsAsync(
  studentId: string,
  correctCount: number,
  totalWords: number,
  accuracy: number,
  relatedId: string
) {
  try {
    const basePoints = correctCount
    const completionBonus = 5
    const perfectBonus = accuracy === 1 ? 3 : 0
    const totalPoints = basePoints + completionBonus + perfectBonus

    const points = await prisma.student_points.upsert({
      where: { studentId },
      create: {
        id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        studentId,
        totalPoints,
        dailyPoints: totalPoints,
        weeklyPoints: totalPoints,
        monthlyPoints: totalPoints,
        level: 1,
      },
      update: {
        totalPoints: { increment: totalPoints },
        dailyPoints: { increment: totalPoints },
        weeklyPoints: { increment: totalPoints },
        monthlyPoints: { increment: totalPoints },
      }
    })

    const newLevel = Math.floor(points.totalPoints / 100) + 1
    if (newLevel !== points.level) {
      await prisma.student_points.update({
        where: { studentId },
        data: { level: newLevel }
      })
    }

    await prisma.point_history.create({
      data: {
        id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        studentId,
        points: totalPoints,
        reason: `学习${totalWords}题(对${correctCount}个+${basePoints}分, 完成+${completionBonus}分${perfectBonus > 0 ? ', 全对+' + perfectBonus + '分' : ''})`,
        relatedType: 'study_record',
        relatedId,
      }
    })

    return { totalPoints, newTotalPoints: points.totalPoints, newLevel }
  } catch (err) {
    console.error('异步更新积分失败:', err)
    return null
  }
}

// POST /api/study-records - 提交答题记录
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { studentId, answers } = await request.json()
    if (!studentId || !answers?.length) {
      return apiResponse.error('参数错误', 400)
    }

    const now = new Date()
    const todayUTC = getTodayUTC()

    // 幂等性检查
    const fiveSecondsAgo = new Date(now.getTime() - 5000)
    const recentRecord = await prisma.study_records.findFirst({
      where: {
        studentId,
        taskDate: todayUTC,
        totalWords: answers.length,
        createdAt: { gte: fiveSecondsAgo },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentRecord) {
      return apiResponse.success({
        message: '答题记录已存在（重复提交已忽略）',
        studyRecordId: recentRecord.id,
        duplicate: true,
      })
    }

    const totalWords = answers.length
    const correctCount = answers.filter((a: any) => a.isCorrect).length
    const wrongCount = totalWords - correctCount
    const accuracy = totalWords > 0 ? correctCount / totalWords : 0
    const totalTime = answers.reduce((sum: number, a: any) => sum + (a.timeSpent || 0), 0)
    const vocabularyIds = [...new Set(answers.map((a: any) => a.vocabularyId))] as string[]

    const srId = `sr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    const coreResult = await prisma.$transaction(async (tx) => {
      const [existingPlans, existingMasteries] = await Promise.all([
        tx.study_plans.findMany({
          where: { studentId, vocabularyId: { in: vocabularyIds } },
          select: { id: true, vocabularyId: true, reviewCount: true, lastReviewAt: true }
        }),
        tx.word_masteries.findMany({
          where: { studentId, vocabularyId: { in: vocabularyIds } },
          select: { id: true, vocabularyId: true, totalWrongCount: true, consecutiveCorrect: true, recentAccuracy: true }
        }),
      ])

      const planMap = new Map(existingPlans.map(p => [p.vocabularyId, p]))
      const masteryMap = new Map(existingMasteries.map(m => [m.vocabularyId, m]))

      const studyRecord = await tx.study_records.create({
        data: {
          id: srId,
          studentId,
          taskDate: todayUTC,
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

      const qaData = answers.map((a: any, i: number) => ({
        id: `qa_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        studentId,
        vocabularyId: a.vocabularyId,
        questionId: a.questionId,
        answer: a.answer,
        isCorrect: a.isCorrect,
        timeSpent: a.timeSpent || null,
        answeredAt: now,
      }))

      await tx.question_answers.createMany({ data: qaData })

      return { studyRecord, planMap, masteryMap }
    }, { timeout: 10000 })

    // 更新或创建 study_plans
    const planUpdates: Promise<any>[] = []
    const plansToCreate: any[] = []

    for (const vocabId of vocabularyIds) {
      const existingPlan = coreResult.planMap.get(vocabId)

      if (existingPlan) {
        // 已有记录，更新
        const lastReviewDate = existingPlan.lastReviewAt ? new Date(existingPlan.lastReviewAt).toDateString() : null
        const todayStr = now.toDateString()
        const alreadyReviewedToday = lastReviewDate === todayStr
        const newReviewCount = alreadyReviewedToday ? existingPlan.reviewCount : existingPlan.reviewCount + 1

        planUpdates.push(
          prisma.study_plans.update({
            where: { id: existingPlan.id },
            data: {
              status: 'LEARNING',
              reviewCount: newReviewCount,
              lastReviewAt: now,
              nextReviewAt: alreadyReviewedToday ? undefined : calculateNextReviewDate(now, newReviewCount),
              updatedAt: now,
            }
          })
        )
      } else {
        // 首次学习，创建记录
        plansToCreate.push({
          id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${vocabId.slice(-4)}`,
          studentId,
          vocabularyId: vocabId,
          status: 'LEARNING',
          reviewCount: 0,
          lastReviewAt: now,
          nextReviewAt: calculateNextReviewDate(now, 0),
          updatedAt: now,
        })
      }
    }

    if (planUpdates.length > 0) {
      await Promise.all(planUpdates)
    }

    if (plansToCreate.length > 0) {
      await prisma.study_plans.createMany({
        data: plansToCreate,
        skipDuplicates: true,
      })
    }

    // 同步更新掌握度
    try {
      await updateMasteries(studentId, answers, coreResult.masteryMap, now)
    } catch (err) {
      console.error('掌握度更新失败，但答题记录已保存:', err)
    }

    // 更新连续学习天数
    try {
      const existingStreak = await prisma.study_streaks.findUnique({
        where: { studentId },
      })

      const todayStr = todayUTC.toDateString()

      if (existingStreak) {
        const lastStudyStr = existingStreak.lastStudyDate?.toDateString()
        const yesterday = new Date(todayUTC)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toDateString()

        let newStreak = 1
        if (lastStudyStr === todayStr) {
          newStreak = existingStreak.currentStreak
        } else if (lastStudyStr === yesterdayStr) {
          newStreak = existingStreak.currentStreak + 1
        }

        await prisma.study_streaks.update({
          where: { studentId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(existingStreak.longestStreak, newStreak),
            lastStudyDate: todayUTC,
            updatedAt: now,
          },
        })
      } else {
        await prisma.study_streaks.create({
          data: {
            id: `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            studentId,
            currentStreak: 1,
            longestStreak: 1,
            lastStudyDate: todayUTC,
          },
        })
      }
    } catch (err) {
      console.error('更新连续学习天数失败:', err)
    }

    // 异步更新积分和成就
    const pointsPromise = updatePointsAsync(studentId, correctCount, totalWords, accuracy, srId)

    checkAndUnlockAchievements(studentId)
      .catch(err => console.error('成就检查失败:', err))

    const pointsResult = await pointsPromise

    return apiResponse.success({
      message: '答题记录已提交',
      studyRecordId: srId,
      stats: {
        totalWords,
        correctCount,
        wrongCount,
        accuracy: Math.round(accuracy * 100),
      },
      points: pointsResult ? {
        earned: pointsResult.totalPoints,
        total: pointsResult.newTotalPoints,
        level: pointsResult.newLevel,
      } : undefined,
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
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

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
