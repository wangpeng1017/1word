import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/response'

// 数据转换函数：将数据库字段转换为前端期望的格式
function formatClassData(classData: any) {
  return {
    ...classData,
    isActive: classData.is_active,
    teacherId: classData.teacher_id,
    createdAt: classData.created_at,
    updatedAt: classData.updated_at,
    teacher: classData.teachers ? {
      ...classData.teachers,
      userId: classData.teachers.user_id,
      createdAt: classData.teachers.created_at,
      updatedAt: classData.teachers.updated_at,
    } : undefined,
    students: classData.students ? classData.students.map((s: any) => ({
      ...s,
      userId: s.user_id,
      studentNo: s.student_no,
      classId: s.class_id,
      wechatId: s.wechat_id,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    })) : undefined,
  }
}

// 获取班级详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以查看班级')
    }

    const classData = await prisma.classes.findUnique({
      where: { id: params.id },
      include: {
        teachers: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        students: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!classData) {
      return notFoundResponse('班级不存在')
    }

    // 转换数据格式
    const formattedClass = formatClassData(classData)

    return successResponse(formattedClass)
  } catch (error) {
    console.error('获取班级详情错误:', error)
    return errorResponse('获取班级详情失败', 500)
  }
}

// 更新班级
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以更新班级')
    }

    const body = await request.json()
    const { name, grade } = body

    if (!name || !grade) {
      return errorResponse('班级名称和年级不能为空')
    }

    const classData = await prisma.classes.update({
      where: { id: params.id },
      data: {
        name,
        grade,
        updated_at: new Date(),
      },
      include: {
        teachers: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: { students: true },
        },
      },
    })

    // 转换数据格式
    const formattedClass = formatClassData(classData)

    return successResponse(formattedClass, '班级更新成功')
  } catch (error) {
    console.error('更新班级错误:', error)
    return errorResponse('更新班级失败', 500)
  }
}

// 删除班级
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除班级')
    }

    // 检查班级是否有学生
    const classData = await prisma.classes.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    })

    if (!classData) {
      return notFoundResponse('班级不存在')
    }

    if (classData._count.students > 0) {
      return errorResponse('该班级还有学生，无法删除。请先将学生转移到其他班级。')
    }

    // 软删除：设置为不活跃
    await prisma.classes.update({
      where: { id: params.id },
      data: { is_active: false },
    })

    return successResponse(null, '班级删除成功')
  } catch (error) {
    console.error('删除班级错误:', error)
    return errorResponse('删除班级失败', 500)
  }
}
