import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// 获取学习计划列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const studentName = searchParams.get('studentName')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const vocabularyId = searchParams.get('vocabularyId')
    // 新增：日期筛选
    const nextReviewStart = searchParams.get('nextReviewStart')
    const nextReviewEnd = searchParams.get('nextReviewEnd')
    const createdStart = searchParams.get('createdStart')
    const createdEnd = searchParams.get('createdEnd')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (studentId) {
      where.studentId = studentId
    }

    // 关联筛选：班级、学生姓名
    const studentsWhere: any = {}
    if (classId) {
      studentsWhere.class_id = classId
    }
    if (studentName) {
      studentsWhere.user = { name: { contains: studentName, mode: 'insensitive' } }
    }
    if (Object.keys(studentsWhere).length > 0) {
      where.students = studentsWhere
    }
    
    if (status) {
      where.status = status
    }

    if (vocabularyId) {
      where.vocabularyId = vocabularyId
    }

    // 下次复习日期筛选
    if (nextReviewStart || nextReviewEnd) {
      where.nextReviewAt = {}
      if (nextReviewStart) {
        where.nextReviewAt.gte = new Date(nextReviewStart)
      }
      if (nextReviewEnd) {
        const endDate = new Date(nextReviewEnd)
        endDate.setHours(23, 59, 59, 999)
        where.nextReviewAt.lte = endDate
      }
    }

    // 创建时间筛选
    if (createdStart || createdEnd) {
      where.createdAt = {}
      if (createdStart) {
        where.createdAt.gte = new Date(createdStart)
      }
      if (createdEnd) {
        const endDate = new Date(createdEnd)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    const [rows, total] = await Promise.all([
      prisma.study_plans.findMany({
        where,
        skip,
        take: limit,
        // 默认按创建时间倒序，最新的在最上面
        orderBy: { createdAt: 'desc' },
        include: {
          students: {
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
                },
              },
            },
          },
          vocabularies: {
            select: {
              word: true,
              difficulty: true,
              is_high_frequency: true,
              // 使用 word_meanings 获取释义
              word_meanings: {
                orderBy: { orderIndex: 'asc' },
                take: 1,
                select: { meaning: true },
              },
            },
          },
        },
      }),
      prisma.study_plans.count({ where }),
    ])

    // 统一前端需要的数据结构
    const studyPlans = rows.map((sp: any) => ({
      id: sp.id,
      studentId: sp.studentId,
      vocabularyId: sp.vocabularyId,
      planClassId: sp.planClassId, // 新增：来源班级计划ID
      status: sp.status,
      reviewCount: sp.reviewCount,
      lastReviewAt: sp.lastReviewAt,
      nextReviewAt: sp.nextReviewAt,
      createdAt: sp.createdAt,
      updatedAt: sp.updatedAt,
      student: { ...sp.students, class: sp.students?.classes },
      vocabulary: {
        word: sp.vocabularies?.word,
        // 从 word_meanings 获取释义
        primaryMeaning: sp.vocabularies?.word_meanings?.[0]?.meaning || '',
        difficulty: sp.vocabularies?.difficulty,
        isHighFrequency: sp.vocabularies?.is_high_frequency,
      },
    }))

    return successResponse({
      studyPlans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('获取学习计划列表错误:', error)
    return errorResponse(`获取学习计划列表失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 更新学习计划
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以更新学习计划')
    }

    const body = await request.json()
    const { planId, status, nextReviewAt } = body

    if (!planId) {
      return errorResponse('缺少计划ID')
    }

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (nextReviewAt) {
      updateData.nextReviewAt = new Date(nextReviewAt)
    }

    const studyPlan = await prisma.study_plans.update({
      where: { id: planId },
      data: updateData,
      include: {
        vocabularies: {
          select: {
            word: true,
            word_meanings: {
              orderBy: { orderIndex: 'asc' },
              take: 1,
              select: { meaning: true },
            },
          },
        },
      },
    })

    // 格式化返回数据
    const formattedPlan = {
      ...studyPlan,
      vocabularies: {
        word: studyPlan.vocabularies?.word,
        primary_meaning: studyPlan.vocabularies?.word_meanings?.[0]?.meaning || '',
      },
    }

    return successResponse(formattedPlan, '学习计划更新成功')
  } catch (error: any) {
    console.error('更新学习计划错误:', error)
    return errorResponse(`更新学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 批量删除学习计划
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除学习计划')
    }

    const { searchParams } = new URL(request.url)
    const planIds = searchParams.get('ids')?.split(',') || []

    if (planIds.length === 0) {
      return errorResponse('缺少计划ID')
    }

    await prisma.study_plans.deleteMany({
      where: {
        id: {
          in: planIds,
        },
      },
    })

    return successResponse(null, '学习计划删除成功')
  } catch (error: any) {
    console.error('删除学习计划错误:', error)
    return errorResponse(`删除学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}
