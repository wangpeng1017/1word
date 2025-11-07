import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/response'

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
  }
}

// GET /api/students/[id] - 获取单个学生信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const student = await prisma.students.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        classes: true,
      },
    })

    if (!student) {
      return apiResponse.notFound('学生不存在')
    }

    const result = {
      id: student.id,
      name: student.user.name,
      studentNo: student.student_no,
      grade: student.grade,
      class: student.classes,
      email: student.user.email,
      phone: student.user.phone,
    }

    return apiResponse.success(result)
  } catch (error) {
    console.error('获取学生信息失败:', error)
    return apiResponse.error('获取学生信息失败')
  }
}

// PUT /api/students/[id] - 更新学生信息
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
      return unauthorizedResponse('只有教师可以更新学生信息')
    }

    const body = await request.json()
    const { name, studentNo, classId, grade } = body

    if (!name || !studentNo) {
      return errorResponse('姓名和学号不能为空')
    }

    // 获取学生信息
    const student = await prisma.students.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!student) {
      return notFoundResponse('学生不存在')
    }

    // 检查学号是否被其他学生使用
    if (studentNo !== student.student_no) {
      const existing = await prisma.students.findUnique({
        where: { student_no: studentNo },
      })
      if (existing) {
        return errorResponse('学号已被使用')
      }
    }

    // 更新用户信息
    await prisma.user.update({
      where: { id: student.user_id },
      data: { 
        name,
        updated_at: new Date(),
      },
    })

    // 更新学生信息
    const updatedStudent = await prisma.students.update({
      where: { id: params.id },
      data: {
        student_no: studentNo,
        class_id: classId || null,
        grade,
        updated_at: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        classes: {
          select: {
            name: true,
            grade: true,
          },
        },
      },
    })

    // 转换数据格式
    const formattedStudent = formatStudentData(updatedStudent)

    return successResponse(formattedStudent, '学生信息更新成功')
  } catch (error) {
    console.error('更新学生信息错误:', error)
    return errorResponse('更新学生信息失败', 500)
  }
}

// DELETE /api/students/[id] - 删除学生
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
      return unauthorizedResponse('只有教师可以删除学生')
    }

    // 获取学生信息
    const student = await prisma.students.findUnique({
      where: { id: params.id },
      include: {
        study_records: true,
        wrong_questions: true,
      },
    })

    if (!student) {
      return notFoundResponse('学生不存在')
    }

    // 检查是否有学习记录
    if (student.study_records.length > 0 || student.wrong_questions.length > 0) {
      // 软删除：停用账号而不是物理删除
      await prisma.user.update({
        where: { id: student.user_id },
        data: { 
          is_active: false,
          updated_at: new Date(),
        },
      })
      return successResponse(null, '学生账号已停用（保留学习数据）')
    }

    // 没有学习记录，可以完全删除
    await prisma.user.delete({
      where: { id: student.user_id },
    })

    return successResponse(null, '学生删除成功')
  } catch (error) {
    console.error('删除学生错误:', error)
    return errorResponse('删除学生失败', 500)
  }
}
