import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { db } from '@/lib/db'
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

// 创建班级 - 使用原生SQL绕过Prisma的必填字段限制
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以创建班级')
    }

    const body = await request.json()
    const { name, grade, teacherId } = body

    if (!name || !grade) {
      return errorResponse('班级名称和年级不能为空')
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

    // 使用原生SQL创建班级，允许teacher_id为NULL
    const classId = nanoid()
    const now = new Date()

    await db.query(
      `INSERT INTO classes (id, name, grade, teacher_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, $5, $5)`,
      [classId, name, grade, finalTeacherId || null, now]
    )

    // 查询创建的班级
    const result = await db.query(
      `SELECT c.*, t.id as teacher_id, t.user_id as teacher_user_id, u.name as teacher_name
       FROM classes c
       LEFT JOIN teachers t ON c.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE c.id = $1`,
      [classId]
    )

    const classData = result.rows[0]
    const formattedClass = {
      id: classData.id,
      name: classData.name,
      grade: classData.grade,
      teacherId: classData.teacher_id,
      isActive: classData.is_active,
      createdAt: classData.created_at,
      updatedAt: classData.updated_at,
      teacher: classData.teacher_id ? {
        id: classData.teacher_id,
        userId: classData.teacher_user_id,
        user: { name: classData.teacher_name }
      } : null,
    }

    return successResponse(formattedClass, '班级创建成功')
  } catch (error) {
    console.error('创建班级错误:', error)
    return errorResponse('创建班级失败', 500)
  }
}
