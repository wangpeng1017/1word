import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/response'

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

    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        teacher: {
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

    return successResponse(classData)
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

    const classData = await prisma.class.update({
      where: { id: params.id },
      data: {
        name,
        grade,
      },
      include: {
        teacher: {
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

    return successResponse(classData, '班级更新成功')
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
    const classData = await prisma.class.findUnique({
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
    await prisma.class.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return successResponse(null, '班级删除成功')
  } catch (error) {
    console.error('删除班级错误:', error)
    return errorResponse('删除班级失败', 500)
  }
}
