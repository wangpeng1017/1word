/**
 * @file badge-service.ts
 * @desc 勋章服务 - 勋章墙、兑换、展示
 */

import { prisma } from '@/lib/prisma'

interface BadgeWallResult {
  obtained: ObtainedBadge[]
  available: AvailableBadge[]
  locked: LockedBadge[]
}

interface ObtainedBadge {
  id: string
  name: string
  icon: string
  description: string
  rarity: string
  unlockedAt: Date
  isDisplayed: boolean
}

interface AvailableBadge {
  id: string
  name: string
  icon: string
  description: string
  rarity: string
  pointsCost: number
  canExchange: boolean
}

interface LockedBadge {
  id: string
  name: string
  icon: string
  description: string
  rarity: string
  condition: string
}

interface ExchangeResult {
  success: boolean
  error?: string
  remainingPoints?: number
  badge?: any
}

interface DisplayResult {
  success: boolean
  error?: string
}

interface GrantResult {
  granted: any[]
}

/**
 * 获取用户勋章墙数据
 */
export async function getBadgeWall(studentId: string): Promise<BadgeWallResult> {
  // 获取所有启用的勋章
  const allBadges = await prisma.badges.findMany({
    where: { isActive: true },
    include: { achievements: true },
  })

  // 获取用户已拥有的勋章
  const userBadges = await prisma.student_badges.findMany({
    where: { studentId },
    include: { badges: true },
  })

  // 获取用户积分
  const userPoints = await prisma.student_points.findUnique({
    where: { studentId },
  })

  const currentPoints = userPoints?.totalPoints || 0
  const ownedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))

  // 分类勋章
  const obtained: ObtainedBadge[] = []
  const available: AvailableBadge[] = []
  const locked: LockedBadge[] = []

  for (const badge of allBadges) {
    const badgeData = badge as any

    if (ownedBadgeIds.has(badge.id)) {
      // 已获得
      const userBadge = userBadges.find(ub => ub.badgeId === badge.id)!
      obtained.push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
        rarity: badge.rarity,
        unlockedAt: userBadge.unlockedAt,
        isDisplayed: userBadge.isDisplayed,
      })
    } else if (badgeData.type === 'EXCHANGE' && badgeData.pointsCost) {
      // 可兑换
      available.push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
        rarity: badge.rarity,
        pointsCost: badgeData.pointsCost,
        canExchange: currentPoints >= badgeData.pointsCost,
      })
    } else {
      // 未解锁（预置勋章）
      locked.push({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
        rarity: badge.rarity,
        condition: badge.achievements?.description || '完成特定成就',
      })
    }
  }

  return { obtained, available, locked }
}

/**
 * 积分兑换勋章
 */
export async function exchangeBadge(studentId: string, badgeId: string): Promise<ExchangeResult> {
  return await prisma.$transaction(async (tx) => {
    // 获取勋章信息
    const badge = await tx.badges.findUnique({
      where: { id: badgeId },
    })

    if (!badge) {
      return { success: false, error: '勋章不存在' }
    }

    const badgeData = badge as any
    if (badgeData.type !== 'EXCHANGE' || !badgeData.pointsCost) {
      return { success: false, error: '该勋章不可兑换' }
    }

    // 检查是否已拥有
    const existing = await tx.student_badges.findUnique({
      where: { studentId_badgeId: { studentId, badgeId } },
    })

    if (existing) {
      return { success: false, error: '已拥有该勋章' }
    }

    // 检查积分
    const points = await tx.student_points.findUnique({
      where: { studentId },
    })

    if (!points || points.totalPoints < badgeData.pointsCost) {
      return { success: false, error: '积分不足' }
    }

    // 扣除积分
    const updatedPoints = await tx.student_points.update({
      where: { studentId },
      data: { totalPoints: { decrement: badgeData.pointsCost } },
    })

    // 发放勋章
    await tx.student_badges.create({
      data: {
        id: `sb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        studentId,
        badgeId,
        isDisplayed: false,
      },
    })

    // 记录积分消耗
    await tx.point_history.create({
      data: {
        id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        studentId,
        points: -badgeData.pointsCost,
        reason: `兑换勋章【${badge.name}】`,
        relatedType: 'badge_exchange',
        relatedId: badgeId,
      },
    })

    return {
      success: true,
      remainingPoints: updatedPoints.totalPoints,
      badge: badge,
    }
  })
}

/**
 * 设置/取消展示勋章
 */
export async function setDisplayBadge(
  studentId: string,
  badgeId: string,
  isDisplayed: boolean
): Promise<DisplayResult> {
  // 检查是否拥有该勋章
  const userBadge = await prisma.student_badges.findUnique({
    where: { studentId_badgeId: { studentId, badgeId } },
  })

  if (!userBadge) {
    return { success: false, error: '未拥有该勋章' }
  }

  // 如果要展示，先检查当前展示数量（最多3个）
  if (isDisplayed) {
    const displayedCount = await prisma.student_badges.count({
      where: { studentId, isDisplayed: true },
    })

    if (displayedCount >= 3) {
      return { success: false, error: '最多只能展示3个勋章' }
    }
  }

  // 更新展示状态
  await prisma.student_badges.update({
    where: { id: userBadge.id },
    data: { isDisplayed },
  })

  return { success: true }
}

/**
 * 解锁成就时自动发放关联勋章
 */
export async function grantBadgeForAchievement(
  studentId: string,
  achievementId: string
): Promise<GrantResult> {
  // 查找关联该成就的勋章
  const badges = await prisma.badges.findMany({
    where: { achievementId, isActive: true },
  })

  const granted: any[] = []

  for (const badge of badges) {
    // 检查是否已拥有
    const existing = await prisma.student_badges.findUnique({
      where: { studentId_badgeId: { studentId, badgeId: badge.id } },
    })

    if (!existing) {
      // 发放勋章
      await prisma.student_badges.create({
        data: {
          id: `sb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          studentId,
          badgeId: badge.id,
          isDisplayed: false,
        },
      })
      granted.push(badge)
    }
  }

  return { granted }
}
