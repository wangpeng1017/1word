/**
 * 定时任务 API - 数据归档
 * POST /api/cron/data-archive
 *
 * 配置 Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/data-archive",
 *     "schedule": "0 3 * * 0"  // 每周日凌晨3点执行
 *   }]
 * }
 */

import { NextRequest } from 'next/server'
import { runAllArchiveTasks, getDataStats } from '@/lib/cron/data-archive'

export async function POST(request: NextRequest) {
  try {
    // 验证 Cron 密钥
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const isVercelCron = request.headers.get('x-vercel-cron') === '1'
      if (!isVercelCron) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // 获取归档前的统计
    const beforeStats = await getDataStats()

    // 执行归档
    const archiveResults = await runAllArchiveTasks()

    // 获取归档后的统计
    const afterStats = await getDataStats()

    return Response.json({
      success: true,
      message: '数据归档完成',
      archive: archiveResults,
      stats: {
        before: beforeStats,
        after: afterStats,
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[CRON] 数据归档失败:', error)
    return Response.json({
      success: false,
      error: error?.message || '未知错误'
    }, { status: 500 })
  }
}

// GET 请求返回统计信息
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getDataStats()

    return Response.json({
      success: true,
      stats,
      message: '数据统计获取成功'
    })
  } catch (error: any) {
    console.error('[CRON] 获取统计失败:', error)
    return Response.json({
      success: false,
      error: error?.message || '未知错误'
    }, { status: 500 })
  }
}
