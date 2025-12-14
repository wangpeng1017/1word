import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, verifyPassword, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// POST /api/auth/change-password - 更改密码
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')

    if (!payload) {
      return unauthorizedResponse('请先登录')
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // 验证参数
    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse('请填写所有密码字段')
    }

    if (newPassword !== confirmPassword) {
      return errorResponse('两次输入的新密码不一致')
    }

    if (newPassword.length < 6) {
      return errorResponse('新密码长度不能少于6位')
    }

    if (currentPassword === newPassword) {
      return errorResponse('新密码不能与当前密码相同')
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, password: true, name: true }
    })

    if (!user) {
      return errorResponse('用户不存在')
    }

    // 验证当前密码
    const isPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isPasswordValid) {
      return errorResponse('当前密码错误')
    }

    // 加密新密码并更新
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        password: hashedPassword,
        updated_at: new Date()
      }
    })

    console.log(`用户 ${user.name} (${payload.userId}) 成功修改密码`)

    return successResponse(null, '密码修改成功')
  } catch (error: any) {
    console.error('修改密码失败:', error)
    return errorResponse('修改密码失败', 500)
  }
}
