/**
 * 艾宾浩斯遗忘曲线算法 - 完善版
 * 复习间隔：1天、2天、4天、7天、15天
 */

export const REVIEW_INTERVALS = [1, 2, 4, 7, 15]

// 默认配置
export const DEFAULT_CONFIG = {
  MASTERY_THRESHOLD: 3,           // 掌握阈值：连续正确3次
  DIFFICULT_THRESHOLD: 3,         // 难点阈值：累计错误3次
  DAILY_NEW_WORDS: 20,            // 每日新词数量
  DAILY_REVIEW_WORDS: 30,         // 每日复习词数量
  RECENT_ACCURACY_COUNT: 3,       // 最近N次用于计算正确率
  INTERRUPT_HOURS: 24,            // 中断判定时长（小时）
}

/**
 * 计算下次复习时间
 * @param lastReviewDate 上次复习时间
 * @param reviewCount 已复习次数（从0开始）
 * @param accuracy 最近正确率 (0-1)，用于动态调整
 * @param difficulty 单词难度 EASY/MEDIUM/HARD
 * @returns 下次复习时间
 */
export function calculateNextReviewDate(
  lastReviewDate: Date,
  reviewCount: number,
  accuracy: number = 1,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM'
): Date {
  const intervalIndex = Math.min(reviewCount, REVIEW_INTERVALS.length - 1)
  let intervalDays = REVIEW_INTERVALS[intervalIndex]
  
  // 根据正确率动态调整间隔
  if (accuracy < 0.6) {
    // 正确率低，缩短间隔
    intervalDays = Math.max(1, Math.floor(intervalDays * 0.5))
  } else if (accuracy >= 0.9) {
    // 正确率高，可延长间隔
    intervalDays = Math.ceil(intervalDays * 1.2)
  }
  
  // 根据难度调整间隔
  const difficultyMultiplier = {
    EASY: 1.2,
    MEDIUM: 1,
    HARD: 0.8,
  }
  intervalDays = Math.ceil(intervalDays * difficultyMultiplier[difficulty])
  
  const nextDate = new Date(lastReviewDate)
  nextDate.setDate(nextDate.getDate() + intervalDays)
  nextDate.setHours(0, 0, 0, 0) // 设置为当天0点
  
  return nextDate
}

/**
 * 判断单词是否已掌握
 * 规则：连续 N 次复习正确率100%
 * @param consecutiveCorrect 连续正确次数
 * @param threshold 掌握阈值，默认3
 * @returns 是否已掌握
 */
export function isMastered(
  consecutiveCorrect: number,
  threshold: number = DEFAULT_CONFIG.MASTERY_THRESHOLD
): boolean {
  return consecutiveCorrect >= threshold
}

/**
 * 判断单词是否为重点难点
 * 规则：累计错误次数 ≥ N 次
 * @param totalWrongCount 累计错误次数
 * @param threshold 难点阈值，默认3
 * @returns 是否为重点难点
 */
export function isDifficult(
  totalWrongCount: number,
  threshold: number = DEFAULT_CONFIG.DIFFICULT_THRESHOLD
): boolean {
  return totalWrongCount >= threshold
}

/**
 * 计算最近N次的正确率
 * @param recentRecords 最近的答题记录 [true, false, true] true表示正确
 * @returns 正确率（0-1之间）
 */
export function calculateRecentAccuracy(recentRecords: boolean[]): number {
  if (recentRecords.length === 0) return 0
  const correctCount = recentRecords.filter(r => r).length
  return correctCount / recentRecords.length
}

/**
 * 计算单词优先级
 * 优先级越高，越需要先夏习
 * @param isDifficult 是否为难点
 * @param daysSinceLastReview 距离上次复习天数
 * @param reviewCount 复习次数
 * @returns 优先级分数（越高越优先）
 */
export function calculatePriority(
  isDifficult: boolean,
  daysSinceLastReview: number,
  reviewCount: number
): number {
  let priority = 0
  
  // 难点词汇加权
  if (isDifficult) {
    priority += 100
  }
  
  // 超期未复习加权
  priority += daysSinceLastReview * 10
  
  // 复习次数少的优先
  priority += Math.max(0, 5 - reviewCount) * 5
  
  return priority
}

/**
 * 判断是否需要今天复习
 * @param nextReviewDate 下次复习日期
 * @param today 今天的日期
 * @returns 是否需要今天复习
 */
export function shouldReviewToday(nextReviewDate: Date, today: Date = new Date()): boolean {
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  
  const reviewDateStart = new Date(nextReviewDate)
  reviewDateStart.setHours(0, 0, 0, 0)
  
  return reviewDateStart <= todayStart
}

/**
 * 获取今天的日期（去除时间）
 */
export function getTodayDate(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * 计算两个日期之间的天数
 */
export function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
