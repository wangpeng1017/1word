import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import fs from 'fs'

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
    const errorLog = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/public/customer-service',
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
      code: (error as any).code,
      meta: (error as any).meta,
      env: {
        DATABASE_URL: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'),
        NODE_ENV: process.env.NODE_ENV
      }
    }

    try {
      fs.appendFileSync('/tmp/backend-debug.log', JSON.stringify(errorLog, null, 2) + '\n---\n')
    } catch (e: any) {
      console.error('Failed to write to log file:', e.message)
    }

    console.error('获取客服二维码错误:', error)
    return errorResponse('获取客服信息失败', 500)
  }
}
