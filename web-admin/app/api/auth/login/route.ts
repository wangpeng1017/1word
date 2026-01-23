/**
 * @file route.ts
 * @desc 用户登录 API（使用 Prisma）
 * @input 依赖: lib/prisma, lib/auth, lib/response
 * @output 导出: POST /api/auth/login
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹 of _INDEX.md
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { LoginRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // 先读取原始文本用于调试
    const rawBody = await request.text()
    console.log('[LOGIN_DEBUG] Raw body:', rawBody)
    console.log('[LOGIN_DEBUG] Raw body length:', rawBody.length)
    console.log('[LOGIN_DEBUG] First char code:', rawBody.charCodeAt(0))

    // 尝试解析JSON
    let body: LoginRequest
    try {
      body = JSON.parse(rawBody)
    } catch (parseError: any) {
      console.error('[LOGIN_DEBUG] JSON parse failed:', parseError.message)
      console.error('[LOGIN_DEBUG] Raw body hex:', Buffer.from(rawBody).toString('hex'))
      throw parseError
    }

    const { email, phone, studentNo, password } = body

    if (!password) {
      return errorResponse('密码不能为空')
    }

    const loginIdentifier = email || phone || studentNo
    if (!loginIdentifier) {
      return errorResponse('请输入账号（邮箱/手机号/学号）')
    }

    // 1) 查找用户
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { phone: loginIdentifier }
        ]
      },
      include: {
        teachers: true,
        students: true
      }
    })

    // 2) 如果没查到，尝试按学号查
    if (!user) {
      const student = await prisma.students.findUnique({
        where: { student_no: loginIdentifier },
        include: { user: true }
      })

      if (student && student.user) {
        // 重新获取完整用户信息（包含关联）
        user = await prisma.user.findUnique({
          where: { id: student.user_id },
          include: {
            teachers: true,
            students: true
          }
        })
      }
    }

    if (!user) {
      return errorResponse('用户不存在')
    }

    if (!user.is_active) {
      return errorResponse('账号已被禁用')
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return errorResponse('密码错误')
    }

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
