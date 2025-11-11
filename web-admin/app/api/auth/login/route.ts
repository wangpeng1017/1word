import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { LoginRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    
    // 详细日志：记录收到的请求体
    console.log('=== 登录请求详情 ===')
    console.log('请求体:', JSON.stringify(body, null, 2))
    console.log('请求头:', Object.fromEntries(request.headers.entries()))
    
    const { email, phone, studentNo, password } = body

    if (!password) {
      console.log('❌ 密码为空')
      return errorResponse('密码不能为空')
    }

    // 支持邮箱/手机号/学号登录
    const loginIdentifier = email || phone || studentNo
    console.log('登录标识符:', loginIdentifier)
    
    if (!loginIdentifier) {
      console.log('❌ 缺少登录标识符')
      return errorResponse('请输入账号（邮箱/手机号/学号）')
    }

    // 1) 先按邮箱或手机号查用户
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { phone: loginIdentifier },
        ],
      },
      include: {
        teachers: { select: { id: true } },
        students: { select: { id: true } },
      },
    })

    // 2) 如果没查到，再按学号查学生→用户
    if (!user) {
      const stu = await prisma.students.findUnique({
        where: { student_no: loginIdentifier },
        select: { user_id: true },
      })
      if (stu) {
        user = await prisma.user.findUnique({
          where: { id: stu.user_id },
          include: {
            teachers: { select: { id: true } },
            students: { select: { id: true } },
          },
        })
      }
    }

    if (!user) {
      return errorResponse('用户不存在')
    }

    if (!user.is_active) {
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
        teacherId: user.teachers?.id,
        studentId: user.students?.id,
      },
      token,
    }, '登录成功')
  } catch (error) {
    console.error('登录错误:', error)
    return errorResponse('登录失败', 500)
  }
}
