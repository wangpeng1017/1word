import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { shouldReviewToday, getTodayDate, calculatePriority, daysBetween, DEFAULT_CONFIG } from '@/lib/ebbinghaus'
import { allocateQuestionTypes, selectQuestionByType, getQuestionTypeStats } from '@/lib/question-type-allocator'

/**
 * 获取学生每日任务
 * GET /api/daily-tasks?studentId=xxx&date=2025-11-05
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const dateParam = searchParams.get('date')

    if (!studentId) {
      return errorResponse('缺少学生ID')
    }

    // 解析日期
    const targetDate = dateParam ? new Date(dateParam) : getTodayDate()
    targetDate.setHours(0, 0, 0, 0)

    // 查找该日期的任务
    let dailyTasks = await prisma.dailyTask.findMany({
      where: {
        studentId,
        taskDate: targetDate,
      },
      include: {
        vocabulary: {
          include: {
            audios: true,
            images: true,
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // 如果没有任务，自动生成
    if (dailyTasks.length === 0) {
      dailyTasks = await generateDailyTasks(studentId, targetDate)
    }

    // 统计任务状态
    const stats = {
      total: dailyTasks.length,
      pending: dailyTasks.filter(t => t.status === 'PENDING').length,
      inProgress: dailyTasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: dailyTasks.filter(t => t.status === 'COMPLETED').length,
      interrupted: dailyTasks.filter(t => t.status === 'INTERRUPTED').length,
    }

    // 为每个任务分配题型，并选择对应的题目
    const vocabularyIds = dailyTasks.map(t => t.vocabularyId)
    const questionTypeAllocation = allocateQuestionTypes(vocabularyIds)
    const questionTypeStats = getQuestionTypeStats(questionTypeAllocation)

    // 为每个任务选择对应题型的题目
    const tasksWithSelectedQuestion = dailyTasks.map(task => {
      const targetType = questionTypeAllocation.get(task.vocabularyId)
      const selectedQuestionId = targetType 
        ? selectQuestionByType(
            task.vocabulary.questions.map(q => ({ id: q.id, type: q.type })),
            targetType
          )
        : task.vocabulary.questions[0]?.id || null

      return {
        ...task,
        targetQuestionType: targetType,
        selectedQuestionId,
      }
    })

    return successResponse({
      tasks: tasksWithSelectedQuestion,
      stats,
      questionTypeStats,
      date: targetDate,
    })
  } catch (error: any) {
    console.error('获取每日任务错误:', error)
    return errorResponse(`获取每日任务失败: ${error?.message || '未知错误'}`, 500)
  }
}

/**
 * 为学生生成每日任务
 */
async function generateDailyTasks(studentId: string, targetDate: Date) {
  // 获取学生的所有学习计划
  const studyPlans = await prisma.studyPlan.findMany({
    where: {
      studentId,
      status: {
        not: 'MASTERED', // 排除已掌握的
      },
    },
    include: {
      vocabulary: {
        select: {
          id: true,
          difficulty: true,
        },
      },
    },
  })

  // 获取单词掌握度信息
  const vocabularyIds = studyPlans.map(p => p.vocabularyId)
  const masteries = await prisma.wordMastery.findMany({
    where: {
      studentId,
      vocabularyId: {
        in: vocabularyIds,
      },
    },
  })

  const masteryMap = new Map(
    masteries.map(m => [m.vocabularyId, m])
  )

  // 筛选需要今日复习的单词
  const wordsToReview = studyPlans
    .filter(plan => {
      const mastery = masteryMap.get(plan.vocabularyId)
      
      // 已掌握的单词跳过
      if (mastery?.isMastered) return false
      
      // 检查是否到了复习时间
      return shouldReviewToday(plan.nextReviewAt || new Date(), targetDate)
    })
    .map(plan => {
      const mastery = masteryMap.get(plan.vocabularyId)
      const daysSince = plan.lastReviewAt 
        ? daysBetween(plan.lastReviewAt, targetDate)
        : 30 // 如果从未复习，给一个大值
      
      return {
        plan,
        mastery,
        priority: calculatePriority(
          mastery?.isDifficult || false,
          daysSince,
          plan.reviewCount
        ),
      }
    })

  // 按优先级排序并取前N个
  wordsToReview.sort((a, b) => b.priority - a.priority)
  const selectedWords = wordsToReview.slice(0, DEFAULT_CONFIG.DAILY_REVIEW_WORDS)

  // 创建每日任务
  const tasksToCreate = selectedWords.map(({ plan }) => ({
    studentId,
    vocabularyId: plan.vocabularyId,
    taskDate: targetDate,
    status: 'PENDING' as const,
  }))

  if (tasksToCreate.length > 0) {
    await prisma.dailyTask.createMany({
      data: tasksToCreate,
      skipDuplicates: true,
    })

    // 重新查询创建的任务
    return await prisma.dailyTask.findMany({
      where: {
        studentId,
        taskDate: targetDate,
      },
      include: {
        vocabulary: {
          include: {
            audios: true,
            images: true,
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  return []
}

/**
 * 更新任务状态
 * PUT /api/daily-tasks
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { taskId, status, startedAt, completedAt } = body

    if (!taskId) {
      return errorResponse('缺少任务ID')
    }

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (startedAt) {
      updateData.startedAt = new Date(startedAt)
    }
    
    if (completedAt) {
      updateData.completedAt = new Date(completedAt)
    }

    const task = await prisma.dailyTask.update({
      where: { id: taskId },
      data: updateData,
    })

    return successResponse(task, '任务状态更新成功')
  } catch (error: any) {
    console.error('更新任务状态错误:', error)
    return errorResponse(`更新任务状态失败: ${error?.message || '未知错误'}`, 500)
  }
}
