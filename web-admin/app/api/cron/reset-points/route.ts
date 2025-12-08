import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse } from '@/lib/response'

// POST /api/cron/reset-points - 重置周期性积分
export async function POST(request: NextRequest) {
  try {
    // 验证 cron secret（防止未授权访问）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return apiResponse.unauthorized('未授权')
    }

    const body = await request.json()
    const { type = 'daily' } = body

    let result: any = {}

    switch (type) {
      case 'daily':
        result.daily = await prisma.student_points.updateMany({
          data: {
            dailyPoints: 0,
            updatedAt: new Date()
          }
        })
        break

      case 'weekly':
        result.weekly = await prisma.student_points.updateMany({
          data: {
            weeklyPoints: 0,
            updatedAt: new Date()
          }
        })
        break

      case 'monthly':
        result.monthly = await prisma.student_points.updateMany({
          data: {
            monthlyPoints: 0,
            updatedAt: new Date()
          }
        })
        break

      case 'all':
        result.daily = await prisma.student_points.updateMany({
          data: {
            dailyPoints: 0,
            updatedAt: new Date()
          }
        })
        result.weekly = await prisma.student_points.updateMany({
          data: {
            weeklyPoints: 0,
            updatedAt: new Date()
          }
        })
        result.monthly = await prisma.student_points.updateMany({
          data: {
            monthlyPoints: 0,
            updatedAt: new Date()
          }
        })
        break

      default:
        return apiResponse.error('无效的重置类型', 400)
    }

    return apiResponse.success({
      message: '积分重置成功',
      type,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('积分重置失败:', error)
    return apiResponse.error(`积分重置失败: ${error?.message || '未知错误'}`)
  }
}
