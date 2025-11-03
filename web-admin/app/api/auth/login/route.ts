import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { LoginRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, phone, password } = body

    if (!password) {
      return errorResponse('密码不能为空')
    }

    if (!email && !phone) {
      return errorResponse('邮箱或手机号至少填写一个')
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ],
      },
      include: {
        teacher: true,
        student: true,
      },
    })

    if (!user) {
      return errorResponse('用户不存在')
    }

    if (!user.isActive) {
      return errorResponse('账号已被禁用')
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return errorResponse('密码错误')
    }

    // 生成token
    const token = generateToken({
      userId: user.id,
      email: user.email || undefined,
      role: user.role,
    })

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        teacherId: user.teacher?.id,
        studentId: user.student?.id,
      },
      token,
    }, '登录成功')
  } catch (error) {
    console.error('登录错误:', error)
    return errorResponse('登录失败', 500)
  }
}
