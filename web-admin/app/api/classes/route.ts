import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// 获取班级列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以查看班级')
    }

    const classes = await prisma.class.findMany({
      where: { isActive: true },
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
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(classes)
  } catch (error) {
    console.error('获取班级列表错误:', error)
    return errorResponse('获取班级列表失败', 500)
  }
}

// 创建班级
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以创建班级')
    }

    const body = await request.json()
    const { name, grade } = body

    if (!name || !grade) {
      return errorResponse('班级名称和年级不能为空')
    }

    // 获取教师ID
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { teacher: true },
    })

    if (!user?.teacher) {
      return errorResponse('教师信息不存在', 404)
    }

    const classData = await prisma.class.create({
      data: {
        name,
        grade,
        teacherId: user.teacher.id,
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
      },
    })

    return successResponse(classData, '班级创建成功')
  } catch (error) {
    console.error('创建班级错误:', error)
    return errorResponse('创建班级失败', 500)
  }
}
