/**
 * @file 完成学习会话 API
 * @desc 学习完成时调用，更新状态并触发后续处理
 * @input 依赖: prisma, auth, ebbinghaus, achievement-checker
 * @output 导出: POST /api/study-sessions/[id]/complete
 * @pos 学习流程核心 - 完成学习时更新掌握度、积分、成就
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { calculateNextReviewDate, getNextReviewCount, isDifficult } from '@/lib/ebbinghaus'
import { checkAndUnlockAchievements } from '@/lib/achievement-checker'
import { getTodayUTC } from '@/lib/date-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/study-sessions/:id/complete - 完成学习会话
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { id: sessionId } = await params
    const now = new Date()
    const todayUTC = getTodayUTC()

    // 查找会话
    const session = await prisma.study_records.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return apiResponse.error('学习会话不存在', 404)
    }

    if (session.status === 'COMPLETED' || session.status === 'COMPLETED_NEW' || session.status === 'COMPLETED_REVIEW') {
      return apiResponse.success({
        message: '学习会话已完成（重复请求已忽略）',
        duplicate: true,
      })
    }

    // 从 sessionId 中解析学习模式（格式：sr_{ts}_m{mode}_d{day}_{random}）
    let sessionMode = 'unknown'
    const idParts = sessionId.split('_')
    for (const part of idParts) {
      if (sessionMode === 'unknown' && part.startsWith('m') && part.length > 1) {
        sessionMode = part.substring(1)
      }
    }
    const completedStatus = sessionMode === 'new' ? 'COMPLETED_NEW'
      : sessionMode === 'review' ? 'COMPLETED_REVIEW'
        : 'COMPLETED'

    // 获取本次学习的所有答题记录
    const answers = await prisma.question_answers.findMany({
      where: {
        studentId: session.studentId,
        answeredAt: { gte: session.startedAt },
      },
    })

    const vocabularyIds = [...new Set(answers.map(a => a.vocabularyId))]

    // 用实际答题数校正 completedWords（增量计数器可能因中断/去重不准确）
    // 注意：answers 可能包含其他会话的记录，用 Math.min 限制上界
    const actualCompletedWords = Math.min(answers.length, session.totalWords)

    // 更新会话状态为已完成
    await prisma.study_records.update({
      where: { id: sessionId },
      data: {
        status: completedStatus, // 根据mode区分完成状态
        isCompleted: true,
        completedWords: actualCompletedWords, // 校正增量计数器偏差
        completedAt: now,
        updatedAt: now,
      },
    })

    // 更新 study_plans（学习进度）
    const existingPlans = await prisma.study_plans.findMany({
      where: { studentId: session.studentId, vocabularyId: { in: vocabularyIds } },
    })
    const planMap = new Map(existingPlans.map(p => [p.vocabularyId, p]))

    const planUpdates: Promise<any>[] = []
    const plansToCreate: any[] = []

    // 构建每个词汇的答题结果
    const vocabCorrectMap = new Map<string, boolean>()
    for (const a of answers) {
      const current = vocabCorrectMap.get(a.vocabularyId)
      vocabCorrectMap.set(a.vocabularyId, current === false ? false : a.isCorrect)
    }

    for (const vocabId of vocabularyIds) {
      const existingPlan = planMap.get(vocabId)
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
          id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${vocabId.slice(-4)}`,
          studentId: session.studentId,
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

    // 更新 word_masteries（掌握度）
    const existingMasteries = await prisma.word_masteries.findMany({
      where: { studentId: session.studentId, vocabularyId: { in: vocabularyIds } },
    })
    const masteryMap = new Map(existingMasteries.map(m => [m.vocabularyId, m]))

    // 获取最近答题记录用于计算掌握度
    const recentAnswers = await prisma.question_answers.findMany({
      where: { studentId: session.studentId, vocabularyId: { in: vocabularyIds } },
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

    const masteryUpdates = answers.map(a => {
      const existing = masteryMap.get(a.vocabularyId)
      const recent = answersByVocab.get(a.vocabularyId) || []
      const isMastered = recent.length >= 3 && recent.every(r => r)

      if (!existing) {
        return prisma.word_masteries.create({
          data: {
            id: `wm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            studentId: session.studentId,
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

    await Promise.all(masteryUpdates)

    // 更新已掌握单词的 study_plans 状态为 MASTERED
    const masteredVocabIds = answers
      .filter(a => {
        const recent = answersByVocab.get(a.vocabularyId) || []
        return recent.length >= 3 && recent.every(r => r)
      })
      .map(a => a.vocabularyId)

    if (masteredVocabIds.length > 0) {
      await prisma.study_plans.updateMany({
        where: { studentId: session.studentId, vocabularyId: { in: masteredVocabIds } },
        data: { status: 'MASTERED', updatedAt: now },
      })
    }

    // 更新连续学习天数
    try {
      const existingStreak = await prisma.study_streaks.findUnique({
        where: { studentId: session.studentId },
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
          where: { studentId: session.studentId },
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
            studentId: session.studentId,
            currentStreak: 1,
            longestStreak: 1,
            lastStudyDate: todayUTC,
          },
        })
      }
    } catch (err) {
      console.error('更新连续学习天数失败:', err)
    }

    // 更新积分
    try {
      const basePoints = session.correctCount
      const completionBonus = 5
      const perfectBonus = session.accuracy === 1 ? 3 : 0
      const totalPoints = basePoints + completionBonus + perfectBonus

      await prisma.student_points.upsert({
        where: { studentId: session.studentId },
        create: {
          id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          studentId: session.studentId,
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

      await prisma.point_history.create({
        data: {
          id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          studentId: session.studentId,
          points: totalPoints,
          reason: `学习${session.completedWords}题(对${session.correctCount}个+${basePoints}分, 完成+${completionBonus}分${perfectBonus > 0 ? ', 全对+' + perfectBonus + '分' : ''})`,
          relatedType: 'study_record',
          relatedId: sessionId,
        }
      })
    } catch (err) {
      console.error('更新积分失败:', err)
    }

    // 异步检查成就
    checkAndUnlockAchievements(session.studentId)
      .catch(err => console.error('成就检查失败:', err))

    return apiResponse.success({
      message: '学习完成',
      stats: {
        totalWords: session.totalWords,
        completedWords: session.completedWords,
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
        accuracy: Math.round(session.accuracy * 100),
        totalTime: session.totalTime,
      },
    })
  } catch (error: any) {
    console.error('完成学习会话失败:', error)
    return apiResponse.error(`完成学习会话失败: ${error?.message || '未知错误'}`)
  }
}
