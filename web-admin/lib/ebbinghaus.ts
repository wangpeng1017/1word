/**
 * 艾宾浩斯遗忘曲线算法
 * 复习间隔：1天、2天、4天、7天、15天
 */

export const REVIEW_INTERVALS = [1, 2, 4, 7, 15]

/**
 * 计算下次复习时间
 * @param lastReviewDate 上次复习时间
 * @param reviewCount 已复习次数（从0开始）
 * @returns 下次复习时间
 */
export function calculateNextReviewDate(
  lastReviewDate: Date,
  reviewCount: number
): Date {
  const intervalIndex = Math.min(reviewCount, REVIEW_INTERVALS.length - 1)
  const intervalDays = REVIEW_INTERVALS[intervalIndex]
  
  const nextDate = new Date(lastReviewDate)
  nextDate.setDate(nextDate.getDate() + intervalDays)
  nextDate.setHours(0, 0, 0, 0) // 设置为当天0点
  
  return nextDate
}

/**
 * 判断单词是否已掌握
 * 规则：连续3次复习正确率100%
 * @param consecutiveCorrect 连续正确次数
 * @returns 是否已掌握
 */
export function isMastered(consecutiveCorrect: number): boolean {
  return consecutiveCorrect >= 3
}

/**
 * 判断单词是否为重点难点
 * 规则：累计错误次数≥3次
 * @param totalWrongCount 累计错误次数
 * @returns 是否为重点难点
 */
export function isDifficult(totalWrongCount: number): boolean {
  return totalWrongCount >= 3
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
