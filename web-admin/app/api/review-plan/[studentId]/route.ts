import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayDate, shouldReviewToday } from '@/lib/ebbinghaus'
import { allocateQuestionTypes, selectQuestionByType } from '@/lib/question-type-allocator'

// 小程序字段统一工具：将蛇形字段转换为驼峰，补充 vocabulary 包裹层
function toCamelVocabulary(v: any) {
  if (!v) return null
  const questions = (v.questions || []).map((q: any) => ({
    id: q.id,
    type: q.type,
    content: q.content,
    sentence: q.sentence,
    audioUrl: q.audioUrl,
    correctAnswer: q.correctAnswer,
    options: (q.question_options || q.options || [])
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((o: any) => ({ id: o.id, content: o.content, isCorrect: o.isCorrect, order: o.order })),
  }))
  return {
    id: v.id,
    word: v.word,
    primaryMeaning: v.primaryMeaning ?? v.primary_meaning,
    secondaryMeaning: v.secondaryMeaning ?? v.secondary_meaning,
    audioUrl: v.audioUrl ?? v.audio_url,
    difficulty: v.difficulty,
    isHighFrequency: v.isHighFrequency ?? v.is_high_frequency,
    questions,
  }
}

/**
 * 获取学生的复习计划和学习进度
 * GET /api/review-plan/[studentId]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { studentId } = params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const targetDate = date ? new Date(date) : getTodayDate()

    // 1. 获取学生信息
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        classes: {
          select: {
            name: true,
            grade: true,
          },
        },
      },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    // 2. 获取今日任务（包含题目/选项）
    const todayTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId,
        taskDate: targetDate,
      },
      include: {
        vocabularies: {
          include: {
            word_audios: true,
            questions: {
              include: {
                question_options: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // 仅统计/下发“有题目的任务”（且未完成），用于小程序首页展示与学习页加载
    const validTasks = todayTasks.filter(t => (t.vocabularies as any)?.questions?.length > 0 && t.status !== 'COMPLETED')

    // 为 validTasks 分配题型与选题（80/20；有音频才分配LISTENING）
    const vocabularyIds = validTasks.map(t => t.vocabularyId)
    const hasAudioMap = new Map<string, boolean>(
      validTasks.map(t => [t.vocabularyId, ((t.vocabularies as any)?.word_audios || []).length > 0])
    )
    const allocation = allocateQuestionTypes(vocabularyIds, hasAudioMap)
    const tasksWithSelection = validTasks.map(t => {
      const targetType = allocation.get(t.vocabularyId)
      const selected = selectQuestionByType(
        (((t.vocabularies as any)?.questions) || []).map((q: any) => ({ id: q.id, type: q.type })),
        targetType as any
      )
      return { ...t, targetQuestionType: targetType, selectedQuestionId: selected }
    })

    // 计算"今天应复习数"：已生成的未完成任务 + 还未生成的应复习计划数量
    const existingPendingCount = validTasks.filter((t: any) => t.status !== 'COMPLETED').length
    // 🔧 修复：计算今日已完成的任务数
    const todayCompletedCount = todayTasks.filter((t: any) => t.status === 'COMPLETED').length
    const existingVocabIdSet = new Set(vocabularyIds)
    // 注意：下面的 duePlans 和 missingCount 放到定义 endOfToday 之后再计算，避免引用顺序问题

    // 3. 获取学习计划统计
    const studyPlans = await prisma.study_plans.findMany({
      where: { studentId },
    })

    const totalWords = studyPlans.length
    const masteredWords = studyPlans.filter(p => p.status === 'MASTERED').length
    const inProgressWords = studyPlans.filter(p => p.status === 'IN_PROGRESS').length
    const pendingWords = studyPlans.filter(p => p.status === 'PENDING').length

    // 4. 获取需要复习的词汇
    // 使用数据库端计数，按 <= 当天23:59:59 统计，避免时区/内存过滤误差
    const endOfToday = new Date(targetDate)
    endOfToday.setHours(23, 59, 59, 999)
    const needReview = await prisma.study_plans.count({
      where: {
        studentId,
        status: { in: ['IN_PROGRESS', 'PENDING'] },
        nextReviewAt: { lte: endOfToday },
      },
    })

    // 当天未生成 daily_tasks 的情况下，基于学习计划估算当日应复习数量
    // 计算缺失计划数量（需在定义 endOfToday 之后）
    // 🔧 修复：排除今日已完成的词汇，避免重复计数
    const completedVocabIds = todayTasks
      .filter(t => t.status === 'COMPLETED')
      .map(t => t.vocabularyId)
    const completedVocabIdSet = new Set(completedVocabIds)

    const duePlans = await prisma.study_plans.findMany({
      where: {
        studentId,
        status: { in: ['IN_PROGRESS', 'PENDING'] },
        nextReviewAt: { lte: endOfToday },
        // 排除今日已完成的词汇
        ...(completedVocabIds.length > 0 && {
          vocabularyId: { notIn: completedVocabIds },
        }),
      },
      select: { vocabularyId: true },
    })
    // missingCount 只计算尚未生成任务的词汇（排除已完成和已存在的未完成任务）
    const missingCount = duePlans.filter(p => !existingVocabIdSet.has(p.vocabularyId) && !completedVocabIdSet.has(p.vocabularyId)).length

    // 🔧 修复：今日应复习总数 = 已完成 + 未完成（不重复计数）
    const todayTotalTasks = todayCompletedCount + existingPendingCount + missingCount

    // 🔧 修复：如果存在缺失的任务（即 dueCount > tasks.length），自动生成
    if (missingCount > 0) {
      console.log(`[review-plan] 检测到 ${missingCount} 个缺失任务，自动生成中...`)

      const missingPlans = duePlans.filter(p => !existingVocabIdSet.has(p.vocabularyId))
      const tasksToCreate = missingPlans.map(plan => ({
        id: `dt_${Date.now()}_${plan.vocabularyId}_${Math.random().toString(36).slice(2, 10)}`,
        studentId,
        vocabularyId: plan.vocabularyId,
        taskDate: targetDate,
        status: 'PENDING' as const,
        updatedAt: new Date(),
      }))

      if (tasksToCreate.length > 0) {
        await prisma.daily_tasks.createMany({
          data: tasksToCreate,
          skipDuplicates: true,
        })
        console.log(`[review-plan] 成功生成 ${tasksToCreate.length} 个任务`)

        // 重新获取今日任务（包含新生成的）
        const refreshedTasks = await prisma.daily_tasks.findMany({
          where: {
            studentId,
            taskDate: targetDate,
          },
          include: {
            vocabularies: {
              include: {
                word_audios: true,
                word_meanings: {
                  orderBy: { orderIndex: 'asc' },
                },
                questions: {
                  include: {
                    question_options: {
                      orderBy: { order: 'asc' },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        // 更新 validTasks 和相关变量
        const refreshedValidTasks = refreshedTasks.filter(
          t => (t.vocabularies as any)?.questions?.length > 0 && t.status !== 'COMPLETED'
        )

        const refreshedVocabularyIds = refreshedValidTasks.map(t => t.vocabularyId)
        const refreshedHasAudioMap = new Map<string, boolean>(
          refreshedValidTasks.map(t => [t.vocabularyId, ((t.vocabularies as any)?.word_audios || []).length > 0])
        )
        const refreshedAllocation = allocateQuestionTypes(refreshedVocabularyIds, refreshedHasAudioMap)
        const refreshedTasksWithSelection = refreshedValidTasks.map(t => {
          const targetType = refreshedAllocation.get(t.vocabularyId)
          const selected = selectQuestionByType(
            (((t.vocabularies as any)?.questions) || []).map((q: any) => ({ id: q.id, type: q.type })),
            targetType as any
          )
          return { ...t, targetQuestionType: targetType, selectedQuestionId: selected }
        })

        // 替换原来的 tasksWithSelection
        tasksWithSelection.splice(0, tasksWithSelection.length, ...refreshedTasksWithSelection)
      }
    }

    // 诊断日志（观察首页显示问题）
    console.log('[review-plan] miniapp overview', {
      studentId,
      date: targetDate.toISOString().slice(0, 10),
      todayTasks: todayTasks.length,
      validTasks: validTasks.length,
      tasksWithSelection: tasksWithSelection.length,
      needReview,
      todayTotalTasks,
      todayCompletedCount,
      missingCount,
    })

    // 5. 获取掌握度统计
    const wordMasteries = await prisma.word_masteries.findMany({
      where: { studentId },
    })

    const difficultWords = wordMasteries.filter(m => m.isDifficult).length
    const avgAccuracy = wordMasteries.length > 0
      ? wordMasteries.reduce((sum, m) => sum + (m.recentAccuracy || 0), 0) / wordMasteries.length
      : 0

    // 6. 获取最近7天的学习记录
    const sevenDaysAgo = new Date(targetDate)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentStudyRecords = await prisma.study_records.findMany({
      where: {
        studentId,
        taskDate: {
          gte: sevenDaysAgo,
          lte: targetDate,
        },
      },
      orderBy: { taskDate: 'asc' },
    })

    // 今日用时（秒）
    const todayRecord = await prisma.study_records.findFirst({
      where: { studentId, taskDate: targetDate },
    })
    const timeSpentSeconds = todayRecord?.totalTime || 0

    // 7. 计算连续学习天数（P2优化：使用study_streaks表缓存）
    let consecutiveDays = 0
    const studyStreak = await prisma.study_streaks.findUnique({
      where: { studentId },
    })

    if (studyStreak) {
      const lastStudy = studyStreak.lastStudyDate
      const today = getTodayDate()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastStudy) {
        const lastStudyStr = new Date(lastStudy).toDateString()
        if (lastStudyStr === today.toDateString() || lastStudyStr === yesterday.toDateString()) {
          consecutiveDays = studyStreak.currentStreak
        }
      }
    }

    // 小程序友好的结构（不破坏原有字段）：
    const miniapp = {
      student: {
        id: student.id,
        name: student.user.name,
        studentNo: student.student_no,
        grade: student.grade,
        className: student.classes?.name || '-',
      },
      today: {
        // today.dueCount 定义为“仍需完成”的任务量（已生成未完成 + 尚未生成的应复习计划）
        dueCount: todayTotalTasks,
        completedCount: todayCompletedCount,
        pendingCount: todayTotalTasks - todayCompletedCount,
        tasks: tasksWithSelection.map((t: any) => ({
          id: t.id,
          status: t.status,
          targetQuestionType: t.targetQuestionType,
          selectedQuestionId: t.selectedQuestionId,
          vocabulary: toCamelVocabulary(t.vocabularies),
        })),
        timeSpentSeconds,
      },
      progress: {
        totalWords,
        masteredWords,
        inProgressWords,
        pendingWords,
        needReview,
        difficultWords,
        masteryRate: totalWords > 0 ? Number(((masteredWords / totalWords) * 100).toFixed(1)) : 0,
        avgAccuracy: Number((avgAccuracy * 100).toFixed(1)),
        consecutiveDays,
      },
      recent: recentStudyRecords.map(r => ({
        date: r.taskDate,
        completed: r.completedWords,
        total: r.totalWords,
        accuracy: Number((r.accuracy * 100).toFixed(1)),
        timeSpent: r.totalTime,
      })),
    }

    return successResponse({
      // 兼容原响应
      students: {
        id: student.id,
        name: student.user.name,
        studentNo: student.student_no,
        grade: student.grade,
        className: student.classes?.name || '-',
      },
      todayTasks: {
        total: todayTasks.length,
        completed: todayTasks.filter(t => t.status === 'COMPLETED').length,
        pending: todayTasks.filter(t => t.status === 'PENDING').length,
        tasks: todayTasks.map(t => ({
          id: t.id,
          word: t.vocabularies.word,
          primaryMeaning: (t.vocabularies as any).primary_meaning ?? (t.vocabularies as any).primaryMeaning,
          difficulty: t.vocabularies.difficulty,
          status: t.status,
        })),
      },
      progress: {
        totalWords,
        masteredWords,
        inProgressWords,
        pendingWords,
        needReview,
        difficultWords,
        masteryRate: totalWords > 0 ? (masteredWords / totalWords * 100).toFixed(1) : 0,
        avgAccuracy: (avgAccuracy * 100).toFixed(1),
        consecutiveDays,
      },
      recentActivity: recentStudyRecords.map(r => ({
        date: r.taskDate,
        completed: r.completedWords,
        total: r.totalWords,
        accuracy: (r.accuracy * 100).toFixed(1),
        timeSpent: r.totalTime,
      })),
      // 新增：小程序友好的 overview
      miniapp,
    })
  } catch (error) {
    console.error('获取复习计划错误:', error)
    return errorResponse('获取复习计划失败', 500)
  }
}
