/**
 * @file route.ts
 * @desc 班级管理 API - 列表查询和创建
 * @input 依赖: prisma, auth, response
 * @output 导出: GET /api/classes, POST /api/classes
 * @see PRD: docs/classes/PRD.md
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
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
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以查看班级')
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

    return successResponse(formattedClasses)
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
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以创建班级')
    }

    const body = await request.json()
    const { name, teacherId } = body

    if (!name) {
      return errorResponse('班级名称不能为空')
    }

    let finalTeacherId = teacherId

    // 如果是教师角色，使用自己的教师ID
    if (payload.role === 'TEACHER') {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { teachers: true },
      })

      if (!user?.teachers) {
        return errorResponse('教师信息不存在', 404)
      }
      finalTeacherId = user.teachers.id
    }

    // 使用 Prisma 创建班级（teacher_id 现在是可选字段）
    const newClass = await prisma.classes.create({
      data: {
        id: nanoid(),
        name,
        teacher_id: finalTeacherId || null,
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

    return successResponse(formatClassData(newClass), '班级创建成功')
  } catch (error) {
    console.error('创建班级错误:', error)
    return errorResponse('创建班级失败', 500)
  }
}
