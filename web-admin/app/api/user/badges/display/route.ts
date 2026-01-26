/**
 * @file route.ts
 * @desc 勋章展示API - 设置/取消展示勋章
 */

import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { setDisplayBadge } from '@/lib/badge-service'
import { prisma } from '@/lib/prisma'

// PUT /api/user/badges/display - 设置展示勋章
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { badgeId, isDisplayed } = await request.json()
    if (!badgeId || typeof isDisplayed !== 'boolean') {
      return apiResponse.error('参数错误', 400)
    }

    // 获取学生ID
    const student = await prisma.students.findUnique({
      where: { user_id: payload.userId },
    })

    if (!student) {
      return apiResponse.error('学生信息不存在', 404)
    }

    const result = await setDisplayBadge(student.id, badgeId, isDisplayed)

    if (!result.success) {
      return apiResponse.error(result.error || '设置失败', 400)
    }

    return apiResponse.success({
      message: isDisplayed ? '已设为展示' : '已取消展示',
    })
  } catch (error: any) {
    console.error('设置展示勋章失败:', error)
    return apiResponse.error(`设置展示勋章失败: ${error?.message || '未知错误'}`)
  }
}
