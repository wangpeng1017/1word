/**
 * @file route.ts
 * @desc 积分兑换API - 获取可兑换成就和执行兑换
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/achievements/redeem - 获取可兑换成就列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('studentId')

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: '缺少学生ID' },
                { status: 400 }
            )
        }

        // 获取所有可兑换成就
        const redeemableAchievements = await prisma.redeemable_achievements.findMany({
            where: { isActive: true },
            orderBy: { pointsCost: 'asc' },
        })

        // 获取学生已兑换的成就
        const redemptions = await prisma.achievement_redemptions.findMany({
            where: { studentId },
        })

        const redeemedIds = redemptions.map((r) => r.achievementId)

        // 合并数据
        const achievementsWithStatus = redeemableAchievements.map((achievement) => ({
            ...achievement,
            isRedeemed: redeemedIds.includes(achievement.id),
            redeemedAt: redemptions.find((r) => r.achievementId === achievement.id)?.redeemedAt || null,
        }))

        // 获取学生当前积分
        const studentPoints = await prisma.student_points.findUnique({
            where: { studentId },
        })

        return NextResponse.json({
            success: true,
            data: {
                achievements: achievementsWithStatus,
                currentPoints: studentPoints?.totalPoints || 0,
            },
        })
    } catch (error) {
        console.error('[API] 获取可兑换成就失败:', error)
        return NextResponse.json(
            { success: false, error: '获取可兑换成就失败' },
            { status: 500 }
        )
    }
}

// POST /api/achievements/redeem - 兑换成就
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { studentId, achievementId } = body

        if (!studentId || !achievementId) {
            return NextResponse.json(
                { success: false, error: '缺少必要参数' },
                { status: 400 }
            )
        }

        // 检查是否已兑换
        const existing = await prisma.achievement_redemptions.findUnique({
            where: {
                studentId_achievementId: {
                    studentId,
                    achievementId,
                },
            },
        })

        if (existing) {
            return NextResponse.json(
                { success: false, error: '该成就已兑换' },
                { status: 400 }
            )
        }

        // 获取成就信息
        const achievement = await prisma.redeemable_achievements.findUnique({
            where: { id: achievementId },
        })

        if (!achievement) {
            return NextResponse.json(
                { success: false, error: '成就不存在' },
                { status: 404 }
            )
        }

        // 获取学生积分
        const studentPoints = await prisma.student_points.findUnique({
            where: { studentId },
        })

        if (!studentPoints || studentPoints.totalPoints < achievement.pointsCost) {
            return NextResponse.json(
                { success: false, error: '积分不足' },
                { status: 400 }
            )
        }

        // 执行兑换(事务)
        const result = await prisma.$transaction(async (tx) => {
            // 1. 扣除积分
            await tx.student_points.update({
                where: { studentId },
                data: {
                    totalPoints: {
                        decrement: achievement.pointsCost,
                    },
                },
            })

            // 2. 记录积分历史
            await tx.point_history.create({
                data: {
                    id: `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    studentId,
                    points: -achievement.pointsCost,
                    reason: `兑换成就: ${achievement.name}`,
                    relatedType: 'achievement_redemption',
                    relatedId: achievementId,
                },
            })

            // 3. 创建兑换记录
            const redemption = await tx.achievement_redemptions.create({
                data: {
                    id: `ar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    studentId,
                    achievementId,
                    pointsSpent: achievement.pointsCost,
                },
            })

            // 4. 如果是勋章类型,自动授予勋章
            if (achievement.category === 'badge') {
                // 查找对应的勋章
                const badge = await tx.badges.findFirst({
                    where: {
                        name: achievement.name,
                        isActive: true,
                    },
                })

                if (badge) {
                    // 检查是否已拥有
                    const existingBadge = await tx.student_badges.findUnique({
                        where: {
                            studentId_badgeId: {
                                studentId,
                                badgeId: badge.id,
                            },
                        },
                    })

                    if (!existingBadge) {
                        await tx.student_badges.create({
                            data: {
                                id: `sb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                studentId,
                                badgeId: badge.id,
                            },
                        })
                    }
                }
            }

            return redemption
        })

        return NextResponse.json({
            success: true,
            message: '兑换成功',
            data: result,
        })
    } catch (error) {
        console.error('[API] 兑换成就失败:', error)
        return NextResponse.json(
            { success: false, error: '兑换成就失败' },
            { status: 500 }
        )
    }
}
