import { describe, it, expect } from 'vitest'
import {
  REVIEW_INTERVALS,
  calculateNextReviewDate,
  isMastered,
  isDifficult,
  calculateRecentAccuracy,
  calculatePriority,
  shouldReviewToday,
  daysBetween,
} from '../../../lib/ebbinghaus'

describe('ebbinghaus', () => {
  describe('REVIEW_INTERVALS', () => {
    it('should have correct intervals [1, 2, 4, 7, 15]', () => {
      expect(REVIEW_INTERVALS).toEqual([1, 2, 4, 7, 15])
    })
  })

  describe('calculateNextReviewDate', () => {
    it('should add 1 day for first review (reviewCount=0)', () => {
      const lastReview = new Date(2024, 0, 1) // 本地时间
      const next = calculateNextReviewDate(lastReview, 0)
      expect(next.getDate()).toBe(2)
      expect(next.getMonth()).toBe(0)
    })

    it('should add 2 days for second review (reviewCount=1)', () => {
      const lastReview = new Date(2024, 0, 1)
      const next = calculateNextReviewDate(lastReview, 1)
      expect(next.getDate()).toBe(3)
    })

    it('should add 4 days for third review (reviewCount=2)', () => {
      const lastReview = new Date(2024, 0, 1)
      const next = calculateNextReviewDate(lastReview, 2)
      expect(next.getDate()).toBe(5)
    })

    it('should cap at 15 days for reviewCount >= 4', () => {
      const lastReview = new Date(2024, 0, 1)
      const next = calculateNextReviewDate(lastReview, 10)
      expect(next.getDate()).toBe(16)
    })

    it('should set time to 00:00:00', () => {
      const lastReview = new Date('2024-01-01T15:30:00')
      const next = calculateNextReviewDate(lastReview, 0)
      expect(next.getHours()).toBe(0)
      expect(next.getMinutes()).toBe(0)
    })
  })

  describe('isMastered', () => {
    it('should return true when consecutiveCorrect >= threshold', () => {
      expect(isMastered(3)).toBe(true)
      expect(isMastered(5)).toBe(true)
    })

    it('should return false when consecutiveCorrect < threshold', () => {
      expect(isMastered(2)).toBe(false)
      expect(isMastered(0)).toBe(false)
    })

    it('should use custom threshold', () => {
      expect(isMastered(2, 2)).toBe(true)
      expect(isMastered(4, 5)).toBe(false)
    })
  })

  describe('isDifficult', () => {
    it('should return true when totalWrongCount >= threshold', () => {
      expect(isDifficult(3)).toBe(true)
      expect(isDifficult(5)).toBe(true)
    })

    it('should return false when totalWrongCount < threshold', () => {
      expect(isDifficult(2)).toBe(false)
      expect(isDifficult(0)).toBe(false)
    })
  })

  describe('calculateRecentAccuracy', () => {
    it('should return 0 for empty array', () => {
      expect(calculateRecentAccuracy([])).toBe(0)
    })

    it('should return 1 for all correct', () => {
      expect(calculateRecentAccuracy([true, true, true])).toBe(1)
    })

    it('should return 0 for all wrong', () => {
      expect(calculateRecentAccuracy([false, false, false])).toBe(0)
    })

    it('should calculate correct ratio', () => {
      expect(calculateRecentAccuracy([true, false, true, false])).toBe(0.5)
      expect(calculateRecentAccuracy([true, true, false])).toBeCloseTo(0.667, 2)
    })
  })

  describe('calculatePriority', () => {
    it('should add 100 for difficult words', () => {
      const withDifficult = calculatePriority(true, 0, 0)
      const withoutDifficult = calculatePriority(false, 0, 0)
      expect(withDifficult - withoutDifficult).toBe(100)
    })

    it('should add 10 per day since last review', () => {
      const days5 = calculatePriority(false, 5, 0)
      const days0 = calculatePriority(false, 0, 0)
      expect(days5 - days0).toBe(50)
    })

    it('should prioritize less reviewed words', () => {
      const review0 = calculatePriority(false, 0, 0)
      const review5 = calculatePriority(false, 0, 5)
      expect(review0).toBeGreaterThan(review5)
    })
  })

  describe('shouldReviewToday', () => {
    it('should return true when nextReviewDate is today', () => {
      const today = new Date()
      expect(shouldReviewToday(today, today)).toBe(true)
    })

    it('should return true when nextReviewDate is in the past', () => {
      const past = new Date('2020-01-01')
      const today = new Date('2024-01-01')
      expect(shouldReviewToday(past, today)).toBe(true)
    })

    it('should return false when nextReviewDate is in the future', () => {
      const future = new Date('2025-01-01')
      const today = new Date('2024-01-01')
      expect(shouldReviewToday(future, today)).toBe(false)
    })
  })

  describe('daysBetween', () => {
    it('should return 0 for same day', () => {
      const date = new Date('2024-01-01')
      expect(daysBetween(date, date)).toBe(0)
    })

    it('should return correct days between dates', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-10')
      expect(daysBetween(date1, date2)).toBe(9)
    })

    it('should return absolute value regardless of order', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-10')
      expect(daysBetween(date1, date2)).toBe(daysBetween(date2, date1))
    })
  })
})
