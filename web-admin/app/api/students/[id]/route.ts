/**
 * @file route.ts
 * @desc 学生详情 API - 查询、更新、删除单个学生
 * @input 依赖: prisma, auth, response
 * @output 导出: GET/PUT/DELETE /api/students/[id]
 * @see PRD: docs/students/PRD.md
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/response'

// 数据转换函数
function formatStudentData(student: any) {
  return {
    ...student,
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

    // 统计 KPI 数据
    const [totalWords, masteredWords, studyDaysResult] = await Promise.all([
      // 学习词汇数（word_masteries 总记录数）
      prisma.word_masteries.count({
        where: { studentId: id },
      }),
      // 已掌握词汇数
      prisma.word_masteries.count({
        where: { studentId: id, isMastered: true },
      }),
      // 学习天数（去重 taskDate）
      prisma.study_records.findMany({
        where: { studentId: id, isCompleted: true },
        select: { taskDate: true },
        distinct: ['taskDate'],
      }),
    ])

    const result = {
      id: student.id,
      name: student.user.name,
      studentNo: student.student_no,
      class: student.classes,
      email: student.user.email,
      phone: student.user.phone,
      stats: {
        totalWords,
        masteredWords,
        studyDays: studyDaysResult.length,
      },
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
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以更新学生信息')
    }

    const body = await request.json()
    const { name, studentNo, classId, phone } = body

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

    // 使用事务保护：检查学号唯一性 + 更新用户表 + 更新学生表
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // 1. 检查学号是否被其他学生使用（事务内检查避免竞态条件）
      if (studentNo !== student.student_no) {
        const existing = await tx.students.findUnique({
          where: { student_no: studentNo },
        })
        if (existing) {
          throw new Error('学号已被使用')
        }
      }

      // 2. 更新用户信息
      await tx.user.update({
        where: { id: student.user_id },
        data: {
          name,
          phone: phone || null,
          updated_at: new Date(),
        },
      })

      // 3. 更新学生信息并返回
      return await tx.students.update({
        where: { id: params.id },
        data: {
          student_no: studentNo,
          class_id: classId || null,
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
            },
          },
        },
      })
    })

    // 转换数据格式
    const formattedStudent = formatStudentData(updatedStudent)

    return successResponse(formattedStudent, '学生信息更新成功')
  } catch (error: any) {
    console.error('更新学生信息错误:', error)
    // 处理学号重复的错误
    if (error.message === '学号已被使用') {
      return errorResponse('学号已被使用')
    }
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
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以删除学生')
    }

    // 获取学生信息
    const student = await prisma.students.findUnique({
      where: { id: params.id },
      include: {
        study_records: true,
        question_answers: true, // 改用question_answers替代wrong_questions
      },
    })

    if (!student) {
      return notFoundResponse('学生不存在')
    }

    // 检查是否有学习记录
    if (student.study_records.length > 0 || student.question_answers.length > 0) {
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
