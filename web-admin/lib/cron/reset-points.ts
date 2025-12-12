/**
 * 积分周期重置任务
 * 用于重置 student_points 表中的周期性积分字段
 */

import { prisma } from '@/lib/prisma'

/**
 * 重置每日积分（每天凌晨执行）
 */
export async function resetDailyPoints() {
  try {
    const result = await prisma.student_points.updateMany({
      where: {
        dailyPoints: { gt: 0 }
      },
      data: {
        dailyPoints: 0,
        updatedAt: new Date()
      }
    })
    console.log(`[CRON] 已重置 ${result.count} 名学生的每日积分`)
    return result.count
  } catch (error) {
    console.error('[CRON] 重置每日积分失败:', error)
    throw error
  }
}

/**
 * 重置每周积分（每周一凌晨执行）
 */
export async function resetWeeklyPoints() {
  try {
    const result = await prisma.student_points.updateMany({
      where: {
        weeklyPoints: { gt: 0 }
      },
      data: {
        weeklyPoints: 0,
        updatedAt: new Date()
      }
    })
    console.log(`[CRON] 已重置 ${result.count} 名学生的每周积分`)
    return result.count
  } catch (error) {
    console.error('[CRON] 重置每周积分失败:', error)
    throw error
  }
}

/**
 * 重置每月积分（每月1号凌晨执行）
 */
export async function resetMonthlyPoints() {
  try {
    const result = await prisma.student_points.updateMany({
      where: {
        monthlyPoints: { gt: 0 }
      },
      data: {
        monthlyPoints: 0,
        updatedAt: new Date()
      }
    })
    console.log(`[CRON] 已重置 ${result.count} 名学生的每月积分`)
    return result.count
  } catch (error) {
    console.error('[CRON] 重置每月积分失败:', error)
    throw error
  }
}

/**
 * 智能重置：根据当前时间判断需要重置哪些周期
 * 适用于单次调用场景（如 Vercel Cron 每日触发一次）
 */
export async function smartResetPoints() {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=周日, 1=周一
  const dayOfMonth = now.getDate()

  const results = {
    daily: 0,
    weekly: 0,
    monthly: 0
  }

  // 每天都重置每日积分
  results.daily = await resetDailyPoints()

  // 周一重置每周积分
  if (dayOfWeek === 1) {
    results.weekly = await resetWeeklyPoints()
  }

  // 每月1号重置每月积分
  if (dayOfMonth === 1) {
    results.monthly = await resetMonthlyPoints()
  }

  return results
}
