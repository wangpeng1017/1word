/**
 * 任务中断检测
 * 检测并标记未完成的过期任务为 INTERRUPTED 状态
 */

import { prisma } from '@/lib/prisma'

/**
 * 检测并更新中断的任务
 * 规则：任务日期已过且状态为 IN_PROGRESS 的任务标记为 INTERRUPTED
 *
 * @param studentId 可选，指定学生ID（不传则处理所有学生）
 * @returns 更新的任务数量
 */
export async function detectInterruptedTasks(studentId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where: any = {
    status: 'IN_PROGRESS',
    taskDate: {
      lt: today // 任务日期早于今天
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
    console.log(`[TASK] 检测到 ${result.count} 个中断的任务已更新`)
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
