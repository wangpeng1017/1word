import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * 批量更新系统设置
 * POST /api/settings/batch
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以修改系统设置')
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return errorResponse('无效的设置数据')
    }

    // 批量更新设置
    const updates = Object.entries(settings).map(([key, value]) => {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

      return prisma.system_configs.upsert({
        where: { key },
        create: {
          id: randomUUID(),
          key,
          value: valueStr,
          updatedAt: new Date(),
        },
        update: {
          value: valueStr,
          updatedAt: new Date(),
        },
      })
    })

    await Promise.all(updates)

    return successResponse(settings, '批量更新成功')
  } catch (error) {
    console.error('批量更新系统设置错误:', error)
    return errorResponse('批量更新系统设置失败', 500)
  }
}
