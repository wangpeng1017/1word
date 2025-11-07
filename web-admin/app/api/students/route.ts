import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { StudentCreateInput } from '@/types'
import { nanoid } from 'nanoid'

// 数据转换函数
function formatStudentData(student: any) {
  return {
    ...students,
    userId: student.user_id,
    studentNo: student.student_no,
    classId: student.class_id,
    wechatId: student.wechat_id,
    createdAt: student.created_at,
    updatedAt: student.updated_at,
    user: student.user ? {
      ...students.user,
      isActive: student.user.is_active,
      createdAt: student.user.created_at,
      updatedAt: student.user.updated_at,
    } : undefined,
    class: student.classes ? {
      ...students.classes,
      teacherId: student.classes.teacher_id,
      isActive: student.classes.is_active,
      createdAt: student.classes.created_at,
      updatedAt: student.classes.updated_at,
    } : undefined,
  }
}

// 获取学生列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以查看学生列表')
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (classId) {
      where.class_id = classId
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { student_no: { contains: search } },
      ]
    }

    const [students, total] = await Promise.all([
      prisma.students.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              is_active: true,
            },
          },
          classes: {
            select: {
              id: true,
              name: true,
              grade: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.students.count({ where }),
    ])

    // 转换数据格式
    const formattedStudents = students.map(formatStudentData)

    return successResponse({
      students: formattedStudents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取学生列表错误:', error)
    return errorResponse('获取学生列表失败', 500)
  }
}

// 创建学生
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以创建学生')
    }

    const body: StudentCreateInput = await request.json()
    const { name, studentNo, classId, grade, email, phone, password } = body

    if (!name || !studentNo || !password) {
      return errorResponse('姓名、学号和密码不能为空')
    }

    if (!classId) {
      return errorResponse('必须指定班级')
    }

    // 验证班级是否存在并获取 grade
    const classData = await prisma.classes.findUnique({
      where: { id: classId },
    })

    if (!classData) {
      return errorResponse('班级不存在')
    }

    // 检查学号是否已存在
    const existingStudent = await prisma.students.findUnique({
      where: { student_no: studentNo },
    })

    if (existingStudent) {
      return errorResponse('学号已存在')
    }

    // 检查邮箱或手机号是否已存在
    if (email || phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            email ? { email } : {},
            phone ? { phone } : {},
          ],
        },
      })

      if (existingUser) {
        return errorResponse('邮箱或手机号已被使用')
      }
    }

    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 创建用户和学生
    const userId = nanoid()
    const studentId = nanoid()
    const now = new Date()

    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'STUDENT',
        updated_at: now,
        students: {
          create: {
            id: studentId,
            student_no: studentNo,
            class_id: classId,
            grade: grade || classData.grade,
            updated_at: now,
          },
        },
      },
      include: {
        students: {
          include: {
            classes: true,
          },
        },
      },
    })

    // 转换数据格式
    const formattedUser = {
      ...user,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      student: user.students ? formatStudentData(user.students) : undefined,
    }

    return successResponse(formattedUser, '学生创建成功')
  } catch (error) {
    console.error('创建学生错误:', error)
    return errorResponse('创建学生失败', 500)
  }
}
