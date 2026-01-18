/**
 * 定时任务 API - 积分重置
 * POST /api/cron/reset-points
 *
 * 部署说明：
 * 1. 设置环境变量 CRON_SECRET 作为 API 密钥
 * 2. 使用 Linux crontab 或其他定时工具调用此 API
 * 3. 请求头: Authorization: Bearer {CRON_SECRET}
 *
 * Crontab 示例 (每天凌晨0点):
 * 0 0 * * * curl -X POST http://localhost:3000/api/cron/reset-points -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextRequest } from 'next/server'
import { smartResetPoints } from '@/lib/cron/reset-points'

export async function POST(request: NextRequest) {
  try {
    // 验证 Cron 密钥（必须设置且匹配）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // CRON_SECRET 必须设置，否则拒绝访问
    if (!cronSecret) {
      console.error('[CRON] CRON_SECRET 环境变量未设置')
      return Response.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await smartResetPoints()

    return Response.json({
      success: true,
      message: '积分重置完成',
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[CRON] 积分重置失败:', error)
    return Response.json({
      success: false,
      error: error?.message || '未知错误'
    }, { status: 500 })
  }
}

// 支持 GET 请求（方便测试）
export async function GET(request: NextRequest) {
  return POST(request)
}
