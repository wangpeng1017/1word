/**
 * @file route.ts
 * @desc 勋章兑换API - 积分兑换勋章
 */

import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { exchangeBadge } from '@/lib/badge-service'
import { prisma } from '@/lib/prisma'

// POST /api/user/badges/exchange - 积分兑换勋章
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { badgeId } = await request.json()
    if (!badgeId) {
      return apiResponse.error('缺少 badgeId 参数', 400)
    }

    // 获取学生ID
    const student = await prisma.students.findUnique({
      where: { user_id: payload.userId },
    })

    if (!student) {
      return apiResponse.error('学生信息不存在', 404)
    }

    const result = await exchangeBadge(student.id, badgeId)

    if (!result.success) {
      return apiResponse.error(result.error || '兑换失败', 400)
    }

    return apiResponse.success({
      message: '兑换成功',
      badge: result.badge,
      remainingPoints: result.remainingPoints,
    })
  } catch (error: any) {
    console.error('兑换勋章失败:', error)
    return apiResponse.error(`兑换勋章失败: ${error?.message || '未知错误'}`)
  }
}
