/**
 * @file route.ts
 * @desc 用户勋章墙API - 获取勋章墙数据
 */

import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { getBadgeWall } from '@/lib/badge-service'
import { prisma } from '@/lib/prisma'

// GET /api/user/badges/wall - 获取勋章墙数据
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    // 获取学生ID
    const student = await prisma.students.findUnique({
      where: { user_id: payload.userId },
    })

    if (!student) {
      return apiResponse.error('学生信息不存在', 404)
    }

    const badgeWall = await getBadgeWall(student.id)

    return apiResponse.success(badgeWall)
  } catch (error: any) {
    console.error('获取勋章墙失败:', error)
    return apiResponse.error(`获取勋章墙失败: ${error?.message || '未知错误'}`)
  }
}
