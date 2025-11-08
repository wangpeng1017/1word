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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (studentId) {
      where.studentId = studentId
    }
    
    if (status) {
      where.status = status
    }

    const [rows, total] = await Promise.all([
      prisma.study_plans.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nextReviewAt: 'asc' },
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
              primary_meaning: true,
              difficulty: true,
              is_high_frequency: true,
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
      status: sp.status,
      reviewCount: sp.reviewCount,
      lastReviewAt: sp.lastReviewAt,
      nextReviewAt: sp.nextReviewAt,
      createdAt: sp.createdAt,
      updatedAt: sp.updatedAt,
      student: sp.students,
      vocabulary: {
        word: sp.vocabularies?.word,
        primaryMeaning: sp.vocabularies?.primary_meaning,
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
            primary_meaning: true,
          },
        },
      },
    })

    return successResponse(studyPlan, '学习计划更新成功')
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
