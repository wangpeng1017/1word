/**
 * 浠诲姟涓柇妫€娴? * 妫€娴嬪苟鏍囪瓒呮椂鏈畬鎴愮殑浠诲姟涓?INTERRUPTED 鐘舵€? */

import { prisma } from '@/lib/prisma'

// 榛樿瓒呮椂鏃堕棿锛堝垎閽燂級
const DEFAULT_INTERRUPT_TIMEOUT = 10

/**
 * 鑾峰彇涓柇瓒呮椂閰嶇疆锛堝垎閽燂級
 */
async function getInterruptTimeout(): Promise<number> {
  try {
    const config = await prisma.system_configs.findUnique({
      where: { key: 'studyConfig' }
    })
    if (config?.value) {
      const parsed = JSON.parse(config.value)
      return parsed.interruptTimeout || DEFAULT_INTERRUPT_TIMEOUT
    }
  } catch (e) {
    console.warn('[TASK] 鑾峰彇涓柇瓒呮椂閰嶇疆澶辫触锛屼娇鐢ㄩ粯璁ゅ€?, e)
  }
  return DEFAULT_INTERRUPT_TIMEOUT
}

/**
 * 妫€娴嬪苟鏇存柊涓柇鐨勪换鍔? * 瑙勫垯锛? * 1. 浠诲姟鐘舵€佷负 IN_PROGRESS
 * 2. 寮€濮嬫椂闂磋窛浠婅秴杩囬厤缃殑瓒呮椂鏃堕棿
 *
 * @param studentId 鍙€夛紝鎸囧畾瀛︾敓ID锛堜笉浼犲垯澶勭悊鎵€鏈夊鐢燂級
 * @returns 鏇存柊鐨勪换鍔℃暟閲? */
export async function detectInterruptedTasks(studentId?: string) {
  const timeoutMinutes = await getInterruptTimeout()
  const timeoutMs = timeoutMinutes * 60 * 1000
  const cutoffTime = new Date(Date.now() - timeoutMs)

  const where: any = {
    status: 'IN_PROGRESS',
    startedAt: {
      lt: cutoffTime // 寮€濮嬫椂闂存棭浜庤秴鏃堕槇鍊?    }
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
    console.log(`[TASK] 妫€娴嬪埌 ${result.count} 涓秴鏃朵腑鏂殑浠诲姟宸叉洿鏂帮紙瓒呮椂: ${timeoutMinutes}鍒嗛挓锛塦)
  }

  return result.count
}

/**
 * 妫€娴嬭法澶╂湭瀹屾垚鐨勪换鍔★紙姣忔棩鍑屾櫒鎵ц锛? * 瑙勫垯锛氫换鍔℃棩鏈熸棭浜庝粖澶╀笖鐘舵€佷笉鏄?COMPLETED 鎴?INTERRUPTED
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
    console.log(`[TASK] 妫€娴嬪埌 ${result.count} 涓法澶╀腑鏂殑浠诲姟宸叉洿鏂癭)
  }

  return result.count
}

/**
 * 鑾峰彇瀛︾敓鐨勪腑鏂换鍔＄粺璁? * @param studentId 瀛︾敓ID
 * @returns 涓柇浠诲姟缁熻淇℃伅
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
 * 鎭㈠涓柇鐨勪换鍔★紙瀛︾敓閫夋嫨缁х画澶嶄範锛? * @param taskId 浠诲姟ID
 * @returns 鏇存柊鍚庣殑浠诲姟
 */
export async function resumeInterruptedTask(taskId: string) {
  const task = await prisma.daily_tasks.update({
    where: { id: taskId },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(), // 閲嶆柊寮€濮嬭鏃?      updatedAt: new Date()
    }
  })
  return task
}

/**
 * 鎵归噺鎭㈠瀛︾敓浠婃棩鐨勪腑鏂换鍔? * @param studentId 瀛︾敓ID
 * @returns 鎭㈠鐨勪换鍔℃暟閲? */
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
