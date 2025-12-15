import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'

/**
 * 获取客服二维码（公开接口，无需认证）
 * GET /api/public/customer-service
 */
export async function GET(request: NextRequest) {
  try {
    // 从系统配置中获取客服设置
    const config = await prisma.system_configs.findUnique({
      where: { key: 'customerService' }
    })

    if (!config) {
      return successResponse({ qrcodeUrl: null })
    }

    try {
      const value = JSON.parse(config.value)
      return successResponse({
        qrcodeUrl: value.qrcodeUrl || null
      })
    } catch {
      return successResponse({ qrcodeUrl: null })
    }
  } catch (error) {
    console.error('获取客服二维码错误:', error)
    return errorResponse('获取客服信息失败', 500)
  }
}
