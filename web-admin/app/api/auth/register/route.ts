import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { RegisterRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { email, phone, password, name, role } = body

    // 验证必填字段
    if (!password || !name || !role) {
      return errorResponse('缺少必填字段')
    }

    if (!email && !phone) {
      return errorResponse('邮箱或手机号至少填写一个')
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ],
      },
    })

    if (existingUser) {
      return errorResponse('用户已存在')
    }

    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        name,
        role,
      },
    })

    // 根据角色创建对应的扩展信息
    if (role === 'TEACHER') {
      await prisma.teacher.create({
        data: {
          userId: user.id,
        },
      })
    } else if (role === 'STUDENT') {
      // 学生需要学号，这里暂时使用用户ID
      await prisma.student.create({
        data: {
          userId: user.id,
          studentNo: `STU${Date.now()}`, // 临时学号，后续可以修改
        },
      })
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
      },
      token,
    }, '注册成功')
  } catch (error) {
    console.error('注册错误:', error)
    return errorResponse('注册失败', 500)
  }
}
