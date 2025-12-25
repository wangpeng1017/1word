import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/response'

// POST /api/students/[id]/reset-password - 重置学生密码为手机号
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以重置学生密码')
    }

    // 获取学生信息
    const student = await prisma.students.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    if (!student) {
      return notFoundResponse('学生不存在')
    }

    // 检查学生是否有手机号
    if (!student.user.phone) {
      return errorResponse('该学生没有设置手机号，无法重置密码')
    }

    // 将密码重置为手机号
    const hashedPassword = await hashPassword(student.user.phone)

    await prisma.user.update({
      where: { id: student.user.id },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    })

    console.log(`管理员/教师 ${payload.userId} 重置了学生 ${student.user.name} 的密码`)

    return successResponse(null, `密码已重置为手机号 ${student.user.phone}`)
  } catch (error) {
    console.error('重置学生密码错误:', error)
    return errorResponse('重置密码失败', 500)
  }
}
