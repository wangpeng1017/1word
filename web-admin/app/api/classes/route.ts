import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { nanoid } from 'nanoid'

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
  }
}

// 获取班级列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以查看班级')
    }

    const classes = await prisma.classes.findMany({
      where: { is_active: true },
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
      orderBy: { created_at: 'desc' },
    })

    // 转换数据格式
    const formattedClasses = classes.map(formatClassData)

    return successResponse({ classes: formattedClasses })
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
      include: { teachers: true },
    })

    if (!user?.teachers) {
      return errorResponse('教师信息不存在', 404)
    }

    const classData = await prisma.classes.create({
      data: {
        id: nanoid(),
        name,
        grade,
        teacher_id: user.teachers.id,
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
      },
    })

    // 转换数据格式
    const formattedClass = formatClassData(classData)

    return successResponse(formattedClass, '班级创建成功')
  } catch (error) {
    console.error('创建班级错误:', error)
    return errorResponse('创建班级失败', 500)
  }
}
