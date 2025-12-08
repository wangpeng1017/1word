import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/points/history - 获取积分历史记录
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!studentId) {
      return apiResponse.error('缺少studentId参数', 400)
    }

    const [history, total] = await Promise.all([
      prisma.point_history.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.point_history.count({ where: { studentId } })
    ])

    return apiResponse.success({
      history,
      total,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('获取积分历史失败:', error)
    return apiResponse.error(`获取积分历史失败: ${error?.message || '未知错误'}`)
  }
}
