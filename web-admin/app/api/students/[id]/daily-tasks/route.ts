import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { calculateNextReviewDate } from '@/lib/ebbinghaus'
import { apiResponse } from '@/lib/response'

// 统一小程序所需的数据结构：
// - 将 prisma 返回的 vocabularies/question_options 等字段映射为 vocabulary/options 等
function mapTasksForMiniapp(dailyTasks: any[]) {
  return dailyTasks.map((t: any) => {
    const v = t.vocabularies || t.vocabulary || {}
    const questions = (v.questions || []).map((q: any) => ({
      id: q.id,
      type: q.type,
      content: q.content,
      sentence: q.sentence,
      audioUrl: q.audioUrl,
      correctAnswer: q.correctAnswer,
      options: (q.question_options || q.options || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)).map((o: any) => ({
        id: o.id,
        content: o.content,
        isCorrect: o.isCorrect,
        order: o.order,
      })),
    }))

    const audios = v.word_audios || v.audios || []
    const audioUs = audios.find((a: any) => (a.accent || '').toUpperCase() === 'US')?.audioUrl
    const audioUk = audios.find((a: any) => (a.accent || '').toUpperCase() === 'UK')?.audioUrl
    const defaultAudio = v.audioUrl ?? v.audio_url ?? audioUs ?? audioUk ?? null

    return {
      id: t.id,
      studentId: t.studentId,
      vocabularyId: t.vocabularyId,
      taskDate: t.taskDate,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      vocabulary: {
        id: v.id,
        word: v.word,
        primaryMeaning: v.primaryMeaning ?? v.primary_meaning,
        secondaryMeaning: v.secondaryMeaning ?? v.secondary_meaning,
        audioUrl: defaultAudio,
        audioUs,
        audioUk,
        difficulty: v.difficulty,
        isHighFrequency: v.isHighFrequency ?? v.is_high_frequency,
        questions,
      },
    }
  })
}

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
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    // 获取今日任务
    const dailyTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId,
        taskDate: today,
      },
      include: {
        vocabularies: {
          include: {
            word_audios: true,
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

    const shaped = mapTasksForMiniapp(dailyTasks)
    return apiResponse.success(shaped)
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
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    // 检查今日是否已有任务
    const existingTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId,
        taskDate: { gte: today, lte: endOfToday },
      },
      include: {
        vocabularies: {
          include: {
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
      orderBy: { createdAt: 'asc' },
    })

    if (existingTasks.length > 0) {
      // 幂等：已有任务则直接返回成功
      return apiResponse.success({ message: '今日任务已生成', tasks: existingTasks })
    }

    // 1. 查找需要复习的单词（基于艾宾浩斯曲线）
    const reviewPlans = await prisma.study_plans.findMany({
      where: {
        studentId,
        status: {
          in: ['IN_PROGRESS', 'PENDING'],
        },
        nextReviewAt: {
          lte: endOfToday, // 允许当天任意时间的计划进入复习队列
        },
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
        created_at: 'desc',
      },
    })

    // 3. 为新词创建学习计划（使用 upsert 幂等并显式生成 id）
    const spTimestamp = Date.now()
    let spCounter = 0
    for (const vocab of newVocabularies) {
      await prisma.study_plans.upsert({
        where: {
          studentId_vocabularyId: { studentId, vocabularyId: vocab.id },
        },
        update: {},
        create: {
          id: `sp_${spTimestamp}_${spCounter++}_${Math.random().toString(36).slice(2, 10)}`,
          studentId,
          vocabularyId: vocab.id,
          status: 'PENDING',
          reviewCount: 0,
          nextReviewAt: today,
          updatedAt: new Date(),
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

    // 为 createMany 生成显式 id，避免数据库未配置默认值时报错
    const dtTs = Date.now()
    let dtNum = 0
    const tasksToInsert = tasksToCreate.map(t => ({
      id: `dt_${dtTs}_${dtNum++}_${Math.random().toString(36).slice(2, 10)}`,
      updatedAt: new Date(),
      ...t,
    }))

    await prisma.daily_tasks.createMany({
      data: tasksToInsert,
      skipDuplicates: true, // 防止并发/重复触发造成唯一键冲突
    })

    // 5. 返回创建的任务（带词汇和题目信息）
    const createdTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId,
        taskDate: { gte: today, lte: endOfToday },
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
      orderBy: { createdAt: 'asc' },
    })

    const shaped = mapTasksForMiniapp(createdTasks)
    return apiResponse.success({
      message: `已生成${createdTasks.length}个任务`,
      tasks: shaped,
    })
  } catch (error: any) {
    console.error('生成每日任务失败:', error)
    // 向客户端返回错误详情，方便定位
    return apiResponse.error(`生成每日任务失败: ${error?.message || '未知错误'}`)
  }
}
