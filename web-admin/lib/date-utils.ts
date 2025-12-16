/**
 * 统一日期处理工具函数
 * 解决时区问题，确保所有日期操作一致
 */

/**
 * 获取今天的 UTC 0点时间
 * 用于数据库查询和比较
 */
export function getTodayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/**
 * 获取指定日期的 UTC 0点时间
 */
export function toUTCDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * 获取某天的 UTC 时间范围（用于数据库查询）
 * @returns { start: 当天0点, end: 当天23:59:59.999 }
 */
export function getDateRangeUTC(date?: Date | string): { start: Date; end: Date } {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()

  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))

  return { start, end }
}

/**
 * 获取本地时间的今天0点（用于显示）
 */
export function getTodayLocal(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

/**
 * 判断两个日期是否是同一天（UTC）
 */
export function isSameDayUTC(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  )
}

/**
 * 计算两个日期之间的天数差（UTC）
 */
export function daysBetweenUTC(date1: Date, date2: Date): number {
  const d1 = toUTCDate(date1)
  const d2 = toUTCDate(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}
