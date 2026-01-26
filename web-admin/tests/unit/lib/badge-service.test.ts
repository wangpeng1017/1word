/**
 * @file badge-service.test.ts
 * @desc 勋章服务测试 - TDD RED 阶段
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    badges: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    student_badges: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    student_points: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    point_history: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({
      badges: { findUnique: vi.fn() },
      student_badges: { findUnique: vi.fn(), create: vi.fn() },
      student_points: { findUnique: vi.fn(), update: vi.fn() },
      point_history: { create: vi.fn() },
    })),
  },
}))

import { prisma } from '@/lib/prisma'

// 这些函数将在 lib/badge-service.ts 中实现
import {
  getBadgeWall,
  exchangeBadge,
  setDisplayBadge,
  grantBadgeForAchievement,
} from '@/lib/badge-service'

describe('Badge Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBadgeWall', () => {
    it('应该返回用户的勋章墙数据（已获得、可兑换、未解锁）', async () => {
      const studentId = 'stu_test_001'

      // Mock 所有勋章
      const allBadges = [
        { id: 'badge_1', name: '初窥门径', type: 'PRESET', rarity: 'COMMON', pointsCost: null, achievementId: 'ach_1' },
        { id: 'badge_2', name: '黄金徽章', type: 'EXCHANGE', rarity: 'LEGENDARY', pointsCost: 500, achievementId: null },
        { id: 'badge_3', name: '学海无涯', type: 'PRESET', rarity: 'RARE', pointsCost: null, achievementId: 'ach_2' },
      ]

      // Mock 用户已获得的勋章
      const userBadges = [
        { id: 'sb_1', badgeId: 'badge_1', unlockedAt: new Date(), isDisplayed: true },
      ]

      // Mock 用户积分
      const userPoints = { totalPoints: 600 }

      vi.mocked(prisma.badges.findMany).mockResolvedValue(allBadges as any)
      vi.mocked(prisma.student_badges.findMany).mockResolvedValue(userBadges as any)
      vi.mocked(prisma.student_points.findUnique).mockResolvedValue(userPoints as any)

      const result = await getBadgeWall(studentId)

      expect(result).toHaveProperty('obtained')
      expect(result).toHaveProperty('available')
      expect(result).toHaveProperty('locked')
      expect(result.obtained).toHaveLength(1)
      expect(result.obtained[0].id).toBe('badge_1')
      expect(result.available).toHaveLength(1) // 可兑换的勋章
      expect(result.available[0].id).toBe('badge_2')
      expect(result.available[0].canExchange).toBe(true) // 积分足够
    })

    it('积分不足时 canExchange 应为 false', async () => {
      const studentId = 'stu_test_002'

      const allBadges = [
        { id: 'badge_2', name: '黄金徽章', type: 'EXCHANGE', rarity: 'LEGENDARY', pointsCost: 500, achievementId: null },
      ]

      vi.mocked(prisma.badges.findMany).mockResolvedValue(allBadges as any)
      vi.mocked(prisma.student_badges.findMany).mockResolvedValue([])
      vi.mocked(prisma.student_points.findUnique).mockResolvedValue({ totalPoints: 100 } as any)

      const result = await getBadgeWall(studentId)

      expect(result.available[0].canExchange).toBe(false)
    })
  })

  describe('exchangeBadge', () => {
    it('应该成功兑换勋章并扣除积分', async () => {
      const studentId = 'stu_test_001'
      const badgeId = 'badge_exchange_001'

      const mockBadge = { id: badgeId, name: '黄金徽章', type: 'EXCHANGE', pointsCost: 500 }
      const mockPoints = { totalPoints: 1000 }

      // Mock transaction
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          badges: { findUnique: vi.fn().mockResolvedValue(mockBadge) },
          student_badges: {
            findUnique: vi.fn().mockResolvedValue(null), // 未拥有
            create: vi.fn().mockResolvedValue({ id: 'sb_new', studentId, badgeId }),
          },
          student_points: {
            findUnique: vi.fn().mockResolvedValue(mockPoints),
            update: vi.fn().mockResolvedValue({ totalPoints: 500 }),
          },
          point_history: { create: vi.fn() },
        }
        return fn(tx)
      })

      const result = await exchangeBadge(studentId, badgeId)

      expect(result.success).toBe(true)
      expect(result.remainingPoints).toBe(500)
    })

    it('积分不足时应该返回错误', async () => {
      const studentId = 'stu_test_001'
      const badgeId = 'badge_exchange_001'

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          badges: { findUnique: vi.fn().mockResolvedValue({ id: badgeId, type: 'EXCHANGE', pointsCost: 500 }) },
          student_badges: { findUnique: vi.fn().mockResolvedValue(null) },
          student_points: { findUnique: vi.fn().mockResolvedValue({ totalPoints: 100 }) },
        }
        return fn(tx)
      })

      const result = await exchangeBadge(studentId, badgeId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('积分不足')
    })

    it('已拥有勋章时应该返回错误', async () => {
      const studentId = 'stu_test_001'
      const badgeId = 'badge_exchange_001'

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          badges: { findUnique: vi.fn().mockResolvedValue({ id: badgeId, type: 'EXCHANGE', pointsCost: 500 }) },
          student_badges: { findUnique: vi.fn().mockResolvedValue({ id: 'existing' }) }, // 已拥有
          student_points: { findUnique: vi.fn().mockResolvedValue({ totalPoints: 1000 }) },
        }
        return fn(tx)
      })

      const result = await exchangeBadge(studentId, badgeId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('已拥有')
    })
  })

  describe('setDisplayBadge', () => {
    it('应该成功设置展示勋章', async () => {
      const studentId = 'stu_test_001'
      const badgeId = 'badge_1'

      vi.mocked(prisma.student_badges.findUnique).mockResolvedValue({ id: 'sb_1', studentId, badgeId } as any)
      vi.mocked(prisma.student_badges.count).mockResolvedValue(1) // 当前展示1个
      vi.mocked(prisma.student_badges.update).mockResolvedValue({} as any)

      const result = await setDisplayBadge(studentId, badgeId, true)

      expect(result.success).toBe(true)
    })

    it('未拥有勋章时应该返回错误', async () => {
      const studentId = 'stu_test_001'
      const badgeId = 'badge_not_owned'

      vi.mocked(prisma.student_badges.findUnique).mockResolvedValue(null)

      const result = await setDisplayBadge(studentId, badgeId, true)

      expect(result.success).toBe(false)
      expect(result.error).toContain('未拥有')
    })
  })

  describe('grantBadgeForAchievement', () => {
    it('解锁成就时应该自动发放关联勋章', async () => {
      const studentId = 'stu_test_001'
      const achievementId = 'ach_first_learn'

      const mockBadge = { id: 'badge_1', name: '初窥门径', achievementId }

      vi.mocked(prisma.badges.findMany).mockResolvedValue([mockBadge] as any)
      vi.mocked(prisma.student_badges.findUnique).mockResolvedValue(null) // 未拥有
      vi.mocked(prisma.student_badges.create).mockResolvedValue({ id: 'sb_new' } as any)

      const result = await grantBadgeForAchievement(studentId, achievementId)

      expect(result.granted).toHaveLength(1)
      expect(result.granted[0].id).toBe('badge_1')
    })
  })
})
