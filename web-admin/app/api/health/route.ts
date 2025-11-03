import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/response'

// 健康检查接口
export async function GET(request: NextRequest) {
  return successResponse({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
}
