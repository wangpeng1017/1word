import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { allocateQuestionTypes, selectQuestionByType, getQuestionTypeStats } from '@/lib/question-type-allocator'
import { detectInterruptedTasks } from '@/lib/task-interrupt-detector'
import { getDateRangeUTC } from '@/lib/date-utils'

/**
 * 获取学生每日任务
 * GET /api/daily-tasks?studentId=xxx&date=2025-11-05
 *
 * 注意：此 API 只返回已有任务，不自动生成。
 * 任务生成统一由 /api/students/[id]/daily-tasks POST 处理。
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

    // 检测并更新中断的任务（在查询之前执行）
    await detectInterruptedTasks(studentId)

    // 使用统一的日期处理
    const { start: targetDate, end: endOfDay } = dateParam
      ? getDateRangeUTC(new Date(dateParam))
      : getDateRangeUTC()

    // 查找该日期的任务（不自动生成，由 /api/students/[id]/daily-tasks POST 处理）
    const dailyTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId,
        taskDate: {
          gte: targetDate,
          lte: endOfDay,
        },
      },
      include: {
        vocabularies: {
          include: {
            word_audios: true,
            word_images: true,
            questions: {
              include: {
                question_options: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

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
            task.vocabularies.questions.map(q => ({ id: q.id, type: q.type })),
            targetType
          )
        : task.vocabularies.questions[0]?.id || null

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

    const task = await prisma.daily_tasks.update({
      where: { id: taskId },
      data: updateData,
    })

    return successResponse(task, '任务状态更新成功')
  } catch (error: any) {
    console.error('更新任务状态错误:', error)
    return errorResponse(`更新任务状态失败: ${error?.message || '未知错误'}`, 500)
  }
}
