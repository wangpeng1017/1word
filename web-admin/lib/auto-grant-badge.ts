/**
 * @file auto-grant-badge.ts
 * @desc 勋章自动授予工具函数
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 成就解锁时自动授予对应勋章
 * @param studentId 学生ID
 * @param achievementId 成就ID
 */
export async function autoGrantBadge(studentId: string, achievementId: string) {
    try {
        // 查找该成就对应的勋章
        const badge = await prisma.badges.findFirst({
            where: {
                achievementId,
                isActive: true,
            },
        })

        if (!badge) {
            console.log(`[勋章] 成就 ${achievementId} 没有对应的勋章`)
            return null
        }

        // 检查学生是否已拥有该勋章
        const existingBadge = await prisma.student_badges.findUnique({
            where: {
                studentId_badgeId: {
                    studentId,
                    badgeId: badge.id,
                },
            },
        })

        if (existingBadge) {
            console.log(`[勋章] 学生已拥有勋章: ${badge.name}`)
            return existingBadge
        }

        // 授予勋章
        const studentBadge = await prisma.student_badges.create({
            data: {
                id: `sb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                studentId,
                badgeId: badge.id,
                isDisplayed: true,
                displayOrder: 0,
            },
        })

        console.log(`[勋章] 成功授予勋章: ${badge.name} 给学生 ${studentId}`)
        return studentBadge
    } catch (error) {
        console.error('[勋章] 自动授予失败:', error)
        return null
    }
}

/**
 * 批量检查并授予勋章
 * @param studentId 学生ID
 * @param achievementIds 成就ID列表
 */
export async function batchGrantBadges(studentId: string, achievementIds: string[]) {
    const results = []

    for (const achievementId of achievementIds) {
        const result = await autoGrantBadge(studentId, achievementId)
        if (result) {
            results.push(result)
        }
    }

    return results
}
