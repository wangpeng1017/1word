import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// 获取班级学习计划列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (classId) {
      where.classId = classId
    }
    
    if (status) {
      where.status = status
    }

    const [planClasses, total] = await Promise.all([
      prisma.plan_classes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          classes: {
            select: {
              name: true,
              grade: true,
            },
          },
          vocabularies: {
            select: {
              word: true,
              primaryMeaning: true,
              difficulty: true,
              isHighFrequency: true,
            },
          },
        },
      }),
      prisma.plan_classes.count({ where }),
    ])

    return successResponse({
      planClasses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('获取班级学习计划列表错误:', error)
    return errorResponse(`获取班级学习计划列表失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 批量创建班级学习计划
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以创建班级学习计划')
    }

    const body = await request.json()
    const { classIds, vocabularyIds, startDate, endDate } = body

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return errorResponse('请选择至少一个班级')
    }

    if (!vocabularyIds || !Array.isArray(vocabularyIds) || vocabularyIds.length === 0) {
      return errorResponse('请选择至少一个词汇')
    }

    if (!startDate) {
      return errorResponse('请指定计划开始日期')
    }

    // 验证班级是否存在
    const classes = await prisma.classes.findMany({
      where: {
        id: { in: classIds },
      },
    })

    if (classes.length !== classIds.length) {
      return errorResponse('部分班级不存在')
    }

    // 验证词汇是否存在
    const vocabularies = await prisma.vocabularies.findMany({
      where: {
        id: { in: vocabularyIds },
      },
    })

    if (vocabularies.length !== vocabularyIds.length) {
      return errorResponse('部分词汇不存在')
    }

    // 批量创建计划（跳过已存在的）
    const planClassData: any[] = []
    
    for (const classId of classIds) {
      for (const vocabularyId of vocabularyIds) {
        planClassData.push({
          classId,
          vocabularyId,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          status: 'PENDING',
        })
      }
    }

    // 使用 createMany 批量插入，skipDuplicates 实现幂等
    const result = await prisma.plan_classes.createMany({
      data: planClassData,
      skipDuplicates: true,
    })

    return successResponse(
      { count: result.count },
      `成功创建 ${result.count} 条班级学习计划`
    )
  } catch (error: any) {
    console.error('创建班级学习计划错误:', error)
    return errorResponse(`创建班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 更新班级学习计划
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以更新班级学习计划')
    }

    const body = await request.json()
    const { id, status, startDate, endDate } = body

    if (!id) {
      return errorResponse('缺少计划ID')
    }

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (startDate) {
      updateData.startDate = new Date(startDate)
    }
    
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null
    }

    const planClass = await prisma.plan_classes.update({
      where: { id },
      data: updateData,
      include: {
        classes: {
          select: {
            name: true,
            grade: true,
          },
        },
        vocabularies: {
          select: {
            word: true,
            primaryMeaning: true,
          },
        },
      },
    })

    return successResponse(planClass, '班级学习计划更新成功')
  } catch (error: any) {
    console.error('更新班级学习计划错误:', error)
    return errorResponse(`更新班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 批量删除班级学习计划
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除班级学习计划')
    }

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return errorResponse('缺少计划ID')
    }

    await prisma.plan_classes.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return successResponse(null, '班级学习计划删除成功')
  } catch (error: any) {
    console.error('删除班级学习计划错误:', error)
    return errorResponse(`删除班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}
