import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { calculateNextReviewDate } from '@/lib/ebbinghaus'
import { apiResponse } from '@/lib/response'

// GET /api/students/[id]/daily-tasks - 获取学生当日任务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 获取今日任务
    const dailyTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId,
        taskDate: today,
      },
      include: {
        vocabularies: {
          include: {
            questions: {
              include: {
                question_options: {
                  orderBy: {
                    order: 'asc',
                  },
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

    return apiResponse.success(dailyTasks)
  } catch (error) {
    console.error('获取每日任务失败:', error)
    return apiResponse.error('获取每日任务失败')
  }
}

// POST /api/students/[id]/daily-tasks - 生成学生当日任务
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 检查今日是否已有任务
    const existingTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId,
        taskDate: today,
      },
    })

    if (existingTasks.length > 0) {
      return apiResponse.error('今日任务已生成', 400)
    }

    // 1. 查找需要复习的单词（基于艾宾浩斯曲线）
    const reviewPlans = await prisma.study_plans.findMany({
      where: {
        studentId,
        status: {
          in: ['IN_PROGRESS', 'PENDING'],
        },
        nextReviewAt: {
          lte: today,
        },
      },
      include: {
        vocabulary: true,
      },
      take: 20, // 每天最多20个复习词
    })

    // 2. 查找新词（还没有学习计划的词）
    const existingVocabIds = await prisma.study_plans.findMany({
      where: { studentId },
      select: { vocabularyId: true },
    })

    const existingIds = existingVocabIds.map(p => p.vocabularyId)

    const newVocabularies = await prisma.vocabularies.findMany({
      where: {
        id: {
          notIn: existingIds,
        },
      },
      take: 10, // 每天最多10个新词
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 3. 为新词创建学习计划
    for (const vocab of newVocabularies) {
      await prisma.study_plans.create({
        data: {
          studentId,
          vocabularyId: vocab.id,
          status: 'PENDING',
          reviewCount: 0,
          nextReviewAt: today,
        },
      })
    }

    // 4. 创建每日任务
    const tasksToCreate = [
      ...reviewPlans.map(plan => ({
        studentId,
        vocabularyId: plan.vocabularyId,
        taskDate: today,
        status: 'PENDING' as const,
      })),
      ...newVocabularies.map(vocab => ({
        studentId,
        vocabularyId: vocab.id,
        taskDate: today,
        status: 'PENDING' as const,
      })),
    ]

    if (tasksToCreate.length === 0) {
      return apiResponse.success({ message: '暂无任务', tasks: [] })
    }

    await prisma.daily_tasks.createMany({
      data: tasksToCreate,
    })

    // 5. 返回创建的任务（带词汇和题目信息）
    const createdTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId,
        taskDate: today,
      },
      include: {
        vocabularies: {
          include: {
            questions: {
              include: {
                question_options: {
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    })

    return apiResponse.success({
      message: `已生成${createdTasks.length}个任务`,
      tasks: createdTasks,
    })
  } catch (error) {
    console.error('生成每日任务失败:', error)
    return apiResponse.error('生成每日任务失败')
  }
}
