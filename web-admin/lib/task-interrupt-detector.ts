/**
 * 任务中断检测
 * 检测并标记超时未完成的任务为 INTERRUPTED 状态
 */

import { prisma } from '@/lib/prisma'

// 默认超时时间（分钟）
const DEFAULT_INTERRUPT_TIMEOUT = 10

/**
 * 获取中断超时配置（分钟）
 */
async function getInterruptTimeout(): Promise<number> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'studyConfig' }
    })
    if (config?.value) {
      const parsed = JSON.parse(config.value)
      return parsed.interruptTimeout || DEFAULT_INTERRUPT_TIMEOUT
    }
  } catch (e) {
    console.warn('[TASK] 获取中断超时配置失败，使用默认值', e)
  }
  return DEFAULT_INTERRUPT_TIMEOUT
}

/**
 * 检测并更新中断的任务
 * 规则：
 * 1. 任务状态为 IN_PROGRESS
 * 2. 开始时间距今超过配置的超时时间
 *
 * @param studentId 可选，指定学生ID（不传则处理所有学生）
 * @returns 更新的任务数量
 */
export async function detectInterruptedTasks(studentId?: string) {
  const timeoutMinutes = await getInterruptTimeout()
  const timeoutMs = timeoutMinutes * 60 * 1000
  const cutoffTime = new Date(Date.now() - timeoutMs)

  const where: any = {
    status: 'IN_PROGRESS',
    startedAt: {
      lt: cutoffTime // 开始时间早于超时阈值
    }
  }

  if (studentId) {
    where.studentId = studentId
  }

  const result = await prisma.daily_tasks.updateMany({
    where,
    data: {
      status: 'INTERRUPTED',
      updatedAt: new Date()
    }
  })

  if (result.count > 0) {
    console.log(`[TASK] 检测到 ${result.count} 个超时中断的任务已更新（超时: ${timeoutMinutes}分钟）`)
  }

  return result.count
}

/**
 * 检测跨天未完成的任务（每日凌晨执行）
 * 规则：任务日期早于今天且状态不是 COMPLETED 或 INTERRUPTED
 */
export async function detectCrossDayInterruptedTasks() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result = await prisma.daily_tasks.updateMany({
    where: {
      status: {
        in: ['PENDING', 'IN_PROGRESS']
      },
      taskDate: {
        lt: today
      }
    },
    data: {
      status: 'INTERRUPTED',
      updatedAt: new Date()
    }
  })

  if (result.count > 0) {
    console.log(`[TASK] 检测到 ${result.count} 个跨天中断的任务已更新`)
  }

  return result.count
}

/**
 * 获取学生的中断任务统计
 * @param studentId 学生ID
 * @returns 中断任务统计信息
 */
export async function getInterruptedTasksStats(studentId: string) {
  const interruptedTasks = await prisma.daily_tasks.findMany({
    where: {
      studentId,
      status: 'INTERRUPTED'
    },
    include: {
      vocabularies: {
        select: {
          word: true,
          primary_meaning: true
        }
      }
    },
    orderBy: {
      taskDate: 'desc'
    },
    take: 20
  })

  return {
    count: interruptedTasks.length,
    tasks: interruptedTasks.map(t => ({
      id: t.id,
      word: t.vocabularies.word,
      meaning: t.vocabularies.primary_meaning,
      taskDate: t.taskDate,
      startedAt: t.startedAt
    }))
  }
}

/**
 * 恢复中断的任务（学生选择继续复习）
 * @param taskId 任务ID
 * @returns 更新后的任务
 */
export async function resumeInterruptedTask(taskId: string) {
  const task = await prisma.daily_tasks.update({
    where: { id: taskId },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(), // 重新开始计时
      updatedAt: new Date()
    }
  })
  return task
}

/**
 * 批量恢复学生今日的中断任务
 * @param studentId 学生ID
 * @returns 恢复的任务数量
 */
export async function resumeTodayInterruptedTasks(studentId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const result = await prisma.daily_tasks.updateMany({
    where: {
      studentId,
      status: 'INTERRUPTED',
      taskDate: {
        gte: today,
        lt: tomorrow
      }
    },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      updatedAt: new Date()
    }
  })

  return result.count
}
