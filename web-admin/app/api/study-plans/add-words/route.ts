import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayDate } from '@/lib/ebbinghaus'

/**
 * 为单个学生添加词汇到学习计划
 * POST /api/study-plans/add-words
 * 优化：使用事务保护 + 批量操作避免N+1查询
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以添加学习计划')
    }

    const body = await request.json()
    const { studentId, vocabularyIds, startDate, endDate } = body

    if (!studentId) {
      return errorResponse('缺少学生ID')
    }

    if (!vocabularyIds || vocabularyIds.length === 0) {
      return errorResponse('请至少选择一个词汇')
    }

    // 解析开始日期（默认今天）
    const planStartDate = startDate ? new Date(startDate) : getTodayDate()
    planStartDate.setHours(0, 0, 0, 0)

    // 解析结束日期（可选）
    const planEndDate = endDate ? new Date(endDate) : null
    if (planEndDate) {
      planEndDate.setHours(23, 59, 59, 999)
    }

    // 验证学生是否存在
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    if (!student) {
      return errorResponse('学生不存在')
    }

    // 获取词汇信息（使用 word_meanings 替代 primary_meaning）
    const vocabularies = await prisma.vocabularies.findMany({
      where: {
        id: { in: vocabularyIds }
      },
      select: {
        id: true,
        word: true,
        difficulty: true,
        word_meanings: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
          select: { meaning: true }
        }
      }
    })

    if (vocabularies.length === 0) {
      return errorResponse('没有找到有效的词汇')
    }

    const today = getTodayDate()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // 使用事务保护 + 批量操作
    const result = await prisma.$transaction(async (tx) => {
      // 1. 批量查询已存在的学习计划
      const existingPlans = await tx.study_plans.findMany({
        where: {
          studentId,
          vocabularyId: { in: vocabularyIds }
        },
        select: { vocabularyId: true }
      })
      const existingPlanSet = new Set(existingPlans.map(p => p.vocabularyId))

      // 2. 批量查询已存在的掌握度记录
      const existingMasteries = await tx.word_masteries.findMany({
        where: {
          studentId,
          vocabularyId: { in: vocabularyIds }
        },
        select: { vocabularyId: true }
      })
      const existingMasterySet = new Set(existingMasteries.map(m => m.vocabularyId))

      // 3. 批量查询今日已存在的任务
      const existingTasks = await tx.daily_tasks.findMany({
        where: {
          studentId,
          vocabularyId: { in: vocabularyIds },
          taskDate: { gte: todayStart, lte: todayEnd }
        },
        select: { vocabularyId: true }
      })
      const existingTaskSet = new Set(existingTasks.map(t => t.vocabularyId))

      // 4. 分离需要创建的和重复的词汇
      const toCreate: typeof vocabularies = []
      const duplicates: any[] = []

      for (const vocab of vocabularies) {
        if (existingPlanSet.has(vocab.id)) {
          duplicates.push({
            studentId,
            studentName: student.user.name,
            vocabularyId: vocab.id,
            word: vocab.word,
            primaryMeaning: vocab.word_meanings?.[0]?.meaning || '',
          })
        } else {
          toCreate.push(vocab)
        }
      }

      // 5. 批量创建学习计划
      const plansToCreate = toCreate.map((vocab, index) => ({
        id: `sp_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        studentId,
        vocabularyId: vocab.id,
        status: 'PENDING' as const,
        reviewCount: 0,
        nextReviewAt: planStartDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      if (plansToCreate.length > 0) {
        await tx.study_plans.createMany({
          data: plansToCreate,
          skipDuplicates: true,
        })
      }

      // 6. 批量创建掌握度记录（只为不存在的创建）
      const masteriesToCreate = toCreate
        .filter(vocab => !existingMasterySet.has(vocab.id))
        .map((vocab, index) => ({
          id: `wm_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          studentId,
          vocabularyId: vocab.id,
          totalWrongCount: 0,
          consecutiveCorrect: 0,
          isMastered: false,
          isDifficult: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))

      if (masteriesToCreate.length > 0) {
        await tx.word_masteries.createMany({
          data: masteriesToCreate,
          skipDuplicates: true,
        })
      }

      // 7. 批量创建今日任务（如果开始日期是今天）
      const isStartDateToday = planStartDate >= todayStart && planStartDate <= todayEnd
      if (isStartDateToday) {
        const tasksToCreate = toCreate
          .filter(vocab => !existingTaskSet.has(vocab.id))
          .map((vocab, index) => ({
            id: `dt_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            studentId,
            vocabularyId: vocab.id,
            taskDate: todayStart,
            status: 'PENDING' as const,
            updatedAt: new Date(),
          }))

        if (tasksToCreate.length > 0) {
          await tx.daily_tasks.createMany({
            data: tasksToCreate,
            skipDuplicates: true,
          })
        }
      }

      // 8. 构建返回数据
      const created = toCreate.map((vocab, index) => ({
        planId: plansToCreate[index]?.id,
        studentId,
        studentName: student.user.name,
        vocabularyId: vocab.id,
        word: vocab.word,
        primaryMeaning: vocab.word_meanings?.[0]?.meaning || '',
        status: 'PENDING',
        nextReviewAt: planStartDate,
      }))

      return { created, duplicates }
    })

    return successResponse({
      created: result.created.length,
      duplicates: result.duplicates.length,
      total: vocabularyIds.length,
      plans: result.created,
      duplicateList: result.duplicates,
    }, `成功添加 ${result.created.length} 个词汇${result.duplicates.length > 0 ? `，${result.duplicates.length} 个词汇已存在` : ''}`)
  } catch (error: any) {
    console.error('添加词汇到学习计划错误:', error)
    return errorResponse(`添加词汇失败: ${error?.message || '未知错误'}`, 500)
  }
}
