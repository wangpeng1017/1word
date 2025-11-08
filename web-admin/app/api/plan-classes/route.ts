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
      where.class_id = classId
    }
    
    if (status) {
      where.status = status
    }

    const [planClasses, total] = await Promise.all([
      prisma.plan_classes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
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
              primary_meaning: true,
              difficulty: true,
              is_high_frequency: true,
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
    const timestamp = Date.now()
    let counter = 0
    
    for (const classId of classIds) {
      for (const vocabularyId of vocabularyIds) {
        planClassData.push({
          id: `pc_${timestamp}_${counter++}_${Math.random().toString(36).substr(2, 9)}`,
          class_id: classId,
          vocabulary_id: vocabularyId,
          start_date: new Date(startDate),
          end_date: endDate ? new Date(endDate) : null,
          status: 'PENDING',
          created_at: new Date(),
          updated_at: new Date(),
        })
      }
    }

    // 使用 createMany 批量插入，skipDuplicates 实现幂等
    const result = await prisma.plan_classes.createMany({
      data: planClassData,
      skipDuplicates: true,
    })

    // 同步为每个班级下的每位学生创建/更新个人学习计划（study_plans）
    const studentsByClass = await prisma.students.findMany({
      where: { class_id: { in: classIds } },
      select: { id: true, class_id: true },
    })

    const spTimestamp = Date.now()
    let spCounter = 0

    for (const student of studentsByClass) {
      for (const vocabularyId of vocabularyIds) {
        // 使用复合唯一键进行幂等创建
        await prisma.study_plans.upsert({
          where: {
            studentId_vocabularyId: {
              studentId: student.id,
              vocabularyId,
            },
          },
          create: {
            id: `sp_${spTimestamp}_${spCounter++}_${Math.random().toString(36).substr(2, 9)}`,
            studentId: student.id,
            vocabularyId,
            status: 'PENDING',
            reviewCount: 0,
            nextReviewAt: new Date(startDate),
            updatedAt: new Date(),
          },
          update: {
            updatedAt: new Date(),
          },
        })
      }
    }

    return successResponse(
      { count: result.count },
      `成功创建 ${result.count} 条班级学习计划，并为 ${studentsByClass.length} 名学生同步学习计划`
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
      updateData.start_date = new Date(startDate)
    }
    
    if (endDate !== undefined) {
      updateData.end_date = endDate ? new Date(endDate) : null
    }
    
    updateData.updated_at = new Date()

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
            primary_meaning: true,
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
