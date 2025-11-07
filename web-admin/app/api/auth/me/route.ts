import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    if (!token) {
      return unauthorizedResponse('未提供认证令牌')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return unauthorizedResponse('无效的认证令牌')
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        teachers: true,
        students: {
          include: {
            classes: true,
          },
        },
      },
    })

    if (!user) {
      return unauthorizedResponse('用户不存在')
    }

    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      teacher: user.teachers,
      student: user.students,
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return errorResponse('获取用户信息失败', 500)
  }
}
