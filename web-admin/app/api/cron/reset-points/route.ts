/**
 * 定时任务 API - 积分重置
 * POST /api/cron/reset-points
 *
 * 配置 Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/reset-points",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

import { NextRequest } from 'next/server'
import { smartResetPoints } from '@/lib/cron/reset-points'

export async function POST(request: NextRequest) {
  try {
    // 验证 Cron 密钥（防止恶意调用）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // 如果设置了 CRON_SECRET，则验证
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // 也允许 Vercel Cron 的内部调用
      const isVercelCron = request.headers.get('x-vercel-cron') === '1'
      if (!isVercelCron) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
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
