import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { calculateNextReviewDate, getNextReviewCount, isDifficult } from '@/lib/ebbinghaus'
import { apiResponse } from '@/lib/response'
import { checkAndUnlockAchievements } from '@/lib/achievement-checker'
import { getTodayUTC } from '@/lib/date-utils'
import { validateAnswers, isDuplicatePointsAward, calculatePoints } from '@/lib/points-validator'
import { generateId } from '@/lib/id'

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
            id: generateId('wm'),
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

// 写入错题记录
async function createWrongQuestions(
  studentId: string,
  wrongAnswers: any[],
  now: Date
) {
  if (wrongAnswers.length === 0) return

  try {
    // 获取题目的正确答案（通过 question_options 的 isCorrect 标记，避免洗牌参考系问题）
    const questionIds = wrongAnswers.map(a => a.questionId)
    const questions = await prisma.questions.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        correctAnswer: true,
        question_options: {
          where: { isCorrect: true },
          select: { content: true },
          take: 1,
        },
      },
    })
    // 优先使用正确选项的内容，回退到 correctAnswer 位置标签
    const questionMap = new Map(questions.map(q => [
      q.id,
      q.question_options?.[0]?.content || q.correctAnswer
    ]))

    // 检查已存在的错题记录
    const existingWrongs = await prisma.wrong_questions.findMany({
      where: {
        studentId,
        questionId: { in: questionIds },
      },
      select: { id: true, questionId: true, wrongCount: true },
    })
    const existingMap = new Map(existingWrongs.map(w => [w.questionId, w]))

    // 分离需要创建和更新的记录
    const toCreate: any[] = []
    const toUpdate: Promise<any>[] = []

    for (const answer of wrongAnswers) {
      const correctAnswer = questionMap.get(answer.questionId) || ''
      const existing = existingMap.get(answer.questionId)

      if (existing) {
        // 更新已存在的错题记录
        toUpdate.push(
          prisma.wrong_questions.update({
            where: { id: existing.id },
            data: {
              wrongCount: existing.wrongCount + 1,
              wrongAnswer: answer.answer,
              wrongAt: now,
              status: 'ACTIVE',
            },
          })
        )
      } else {
        // 创建新的错题记录
        toCreate.push({
          id: generateId('wq'),
          studentId,
          vocabularyId: answer.vocabularyId || '',
          questionId: answer.questionId,
          wrongAnswer: answer.answer,
          correctAnswer,
          wrongAt: now,
          wrongCount: 1,
          correctCount: 0,
          status: 'ACTIVE',
        })
      }
    }

    // 批量执行
    if (toCreate.length > 0) {
      await prisma.wrong_questions.createMany({
        data: toCreate,
        skipDuplicates: true,
      })
    }

    if (toUpdate.length > 0) {
      await Promise.all(toUpdate)
    }

    console.log(`错题记录: 新增 ${toCreate.length}, 更新 ${toUpdate.length}`)
  } catch (err) {
    console.error('写入错题记录失败:', err)
    // 不抛出错误，避免影响主流程
  }
}

// 异步更新积分（带防重复检查）
async function updatePointsAsync(
  studentId: string,
  correctCount: number,
  totalWords: number,
  accuracy: number,
  relatedId: string
) {
  try {
    // 防止重复发放积分
    const isDuplicate = await isDuplicatePointsAward(studentId, 'study_record', relatedId)
    if (isDuplicate) {
      console.log(`跳过重复积分发放: studentId=${studentId}, relatedId=${relatedId}`)
      return null
    }

    // 使用统一的积分计算函数
    const { basePoints, completionBonus, perfectBonus, totalPoints } = calculatePoints({
      correctCount,
      totalWords,
      accuracy,
    })

    const points = await prisma.student_points.upsert({
      where: { studentId },
      create: {
        id: generateId('sp'),
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
        id: generateId('ph'),
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

    const { studentId, answers: clientAnswers, isRetestMode, mode } = await request.json()
    if (!studentId || !clientAnswers?.length) {
      return apiResponse.error('参数错误', 400)
    }

    const now = new Date()
    const todayUTC = getTodayUTC()

    // 🔒 服务端验证答案 - 防止客户端伪造 isCorrect
    const validatedAnswers = await validateAnswers(clientAnswers)

    // 幂等性检查（延长到30秒防止快速重复提交）
    const thirtySecondsAgo = new Date(now.getTime() - 30000)
    const recentRecord = await prisma.study_records.findFirst({
      where: {
        studentId,
        taskDate: todayUTC,
        totalWords: validatedAnswers.length,
        createdAt: { gte: thirtySecondsAgo },
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

    // 使用服务端验证后的结果计算统计数据
    const totalWords = validatedAnswers.length
    const correctCount = validatedAnswers.filter(a => a.isCorrect).length
    const wrongCount = totalWords - correctCount
    const accuracy = totalWords > 0 ? correctCount / totalWords : 0
    const totalTime = validatedAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
    const vocabularyIds = [...new Set(validatedAnswers.map(a => a.vocabularyId))] as string[]

    // 数据完整性验证：防止 correctCount 超过 totalWords（理论上不应该发生，但添加保护）
    if (correctCount > totalWords) {
      console.error(`[数据异常] correctCount (${correctCount}) > totalWords (${totalWords})`, {
        studentId,
        answersCount: validatedAnswers.length,
        correctAnswers: validatedAnswers.filter(a => a.isCorrect).length
      })
    }

    const srId = generateId('sr')

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
          completedAt: new Date(now.getTime()),
          isCompleted: true,
          isRetestMode: isRetestMode || false, // 保存错题重测标志
          status: mode === 'new' ? 'COMPLETED_NEW' : (mode === 'review' ? 'COMPLETED_REVIEW' : 'COMPLETED'), // 区分学习模式
          updatedAt: now,
        },
      })

      // 使用服务端验证后的 isCorrect
      const qaData = validatedAnswers.map((a, i) => ({
        id: generateId('qa'),
        studentId,
        vocabularyId: a.vocabularyId || '',
        questionId: a.questionId,
        answer: a.answer,
        isCorrect: a.isCorrect, // 服务端验证后的结果
        timeSpent: a.timeSpent ?? 0, // DB字段NOT NULL，默认0
        answeredAt: now,
      }))

      await tx.question_answers.createMany({ data: qaData })

      return { studyRecord, planMap, masteryMap }
    }, { timeout: 10000 })

    // 更新或创建 study_plans
    const planUpdates: Promise<any>[] = []
    const plansToCreate: any[] = []

    // 构建每个词汇的答题结果（有一题错则视为该词汇答错）- 使用服务端验证后的结果
    const vocabCorrectMap = new Map<string, boolean>()
    for (const a of validatedAnswers) {
      if (!a.vocabularyId) continue
      const current = vocabCorrectMap.get(a.vocabularyId)
      vocabCorrectMap.set(a.vocabularyId, current === false ? false : a.isCorrect)
    }

    for (const vocabId of vocabularyIds) {
      const existingPlan = coreResult.planMap.get(vocabId)
      const isCorrect = vocabCorrectMap.get(vocabId) ?? true

      if (existingPlan) {
        const lastReviewDate = existingPlan.lastReviewAt ? new Date(existingPlan.lastReviewAt).toDateString() : null
        const todayStr = now.toDateString()
        const alreadyReviewedToday = lastReviewDate === todayStr
        const newReviewCount = alreadyReviewedToday
          ? existingPlan.reviewCount
          : getNextReviewCount(existingPlan.reviewCount, isCorrect)

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
        plansToCreate.push({
          id: generateId('sp'),
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

    // 同步更新掌握度 - 使用服务端验证后的结果
    try {
      await updateMasteries(studentId, validatedAnswers, coreResult.masteryMap, now)
    } catch (err) {
      console.error('掌握度更新失败，但答题记录已保存:', err)
    }

    // 写入错题记录 - 使用服务端验证后的结果（重测模式下跳过，因为错题已在错题本中）
    if (!isRetestMode) {
      const wrongAnswers = validatedAnswers.filter(a => !a.isCorrect)
      if (wrongAnswers.length > 0) {
        createWrongQuestions(studentId, wrongAnswers, now)
          .catch(err => console.error('错题记录写入失败:', err))
      }
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
            id: generateId('ss'),
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

    // 异步更新积分和成就（带防重复检查）
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
