/**
 * 统一日期处理工具函数
 * 使用北京时间（UTC+8）确保与用户时区一致
 */

// 北京时间偏移量（毫秒）
const BEIJING_OFFSET = 8 * 60 * 60 * 1000

/**
 * 获取当前北京时间
 */
export function getBeijingNow(): Date {
  const now = new Date()
  return new Date(now.getTime() + BEIJING_OFFSET)
}

/**
 * 获取北京时间的今天日期（UTC 0点表示）
 * 用于数据库查询和比较
 */
export function getTodayBeijing(): Date {
  const beijingNow = getBeijingNow()
  return new Date(Date.UTC(
    beijingNow.getUTCFullYear(),
    beijingNow.getUTCMonth(),
    beijingNow.getUTCDate()
  ))
}

/**
 * 获取北京时间的昨天日期
 */
export function getYesterdayBeijing(): Date {
  const today = getTodayBeijing()
  return new Date(today.getTime() - 24 * 60 * 60 * 1000)
}

/**
 * 获取北京时间的明天日期
 */
export function getTomorrowBeijing(): Date {
  const today = getTodayBeijing()
  return new Date(today.getTime() + 24 * 60 * 60 * 1000)
}

/**
 * 将任意时间转换为北京时间的日期（去除时间部分）
 */
export function toBeijingDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  const beijingTime = new Date(d.getTime() + BEIJING_OFFSET)
  return new Date(Date.UTC(
    beijingTime.getUTCFullYear(),
    beijingTime.getUTCMonth(),
    beijingTime.getUTCDate()
  ))
}

/**
 * 获取北京时间某天的时间范围（用于数据库查询）
 */
export function getBeijingDateRange(date?: Date | string): { start: Date; end: Date } {
  const targetDate = date ? toBeijingDate(date) : getTodayBeijing()
  const start = targetDate
  const end = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000 - 1)
  return { start, end }
}

/**
 * 判断两个日期是否是同一天（北京时间）
 */
export function isSameDayBeijing(date1: Date, date2: Date): boolean {
  const d1 = toBeijingDate(date1)
  const d2 = toBeijingDate(date2)
  return d1.getTime() === d2.getTime()
}

/**
 * 计算两个日期之间的天数差（北京时间）
 */
export function daysBetweenBeijing(date1: Date, date2: Date): number {
  const d1 = toBeijingDate(date1)
  const d2 = toBeijingDate(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 判断日期是否是今天（北京时间）
 */
export function isTodayBeijing(date: Date): boolean {
  return isSameDayBeijing(date, new Date())
}

/**
 * 格式化日期为 YYYY-MM-DD（北京时间）
 */
export function formatDateBeijing(date: Date): string {
  const beijingDate = toBeijingDate(date)
  return beijingDate.toISOString().slice(0, 10)
}

// ============ 兼容旧代码的别名 ============

/** @deprecated 使用 getTodayBeijing() 代替 */
export function getTodayUTC(): Date {
  return getTodayBeijing()
}

/** @deprecated 使用 toBeijingDate() 代替 */
export function toUTCDate(date: Date | string): Date {
  return toBeijingDate(date)
}

/** @deprecated 使用 getBeijingDateRange() 代替 */
export function getDateRangeUTC(date?: Date | string): { start: Date; end: Date } {
  return getBeijingDateRange(date)
}

/** @deprecated 使用 getTodayBeijing() 代替 */
export function getTodayLocal(): Date {
  return getTodayBeijing()
}

/** @deprecated 使用 isSameDayBeijing() 代替 */
export function isSameDayUTC(date1: Date, date2: Date): boolean {
  return isSameDayBeijing(date1, date2)
}

/** @deprecated 使用 daysBetweenBeijing() 代替 */
export function daysBetweenUTC(date1: Date, date2: Date): number {
  return daysBetweenBeijing(date1, date2)
}
