/**
 * @file route.ts
 * @desc 学生勋章API - 获取学生的勋章列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/students/[id]/badges - 获取学生勋章
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const studentId = params.id

        // 获取学生的所有勋章
        const studentBadges = await prisma.student_badges.findMany({
            where: {
                studentId,
            },
            include: {
                badges: true,
            },
            orderBy: [
                { displayOrder: 'asc' },
                { unlockedAt: 'desc' },
            ],
        })

        // 获取所有勋章定义
        const allBadges = await prisma.badges.findMany({
            where: { isActive: true },
        })

        // 合并数据:已解锁和未解锁
        const badgesWithStatus = allBadges.map((badge) => {
            const studentBadge = studentBadges.find((sb) => sb.badgeId === badge.id)
            return {
                ...badge,
                isUnlocked: !!studentBadge,
                unlockedAt: studentBadge?.unlockedAt || null,
                isDisplayed: studentBadge?.isDisplayed || false,
                displayOrder: studentBadge?.displayOrder || 0,
            }
        })

        // 获取显示在用户名旁的勋章(最多3个)
        const displayedBadges = studentBadges
            .filter((sb) => sb.isDisplayed)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .slice(0, 3)
            .map((sb) => sb.badges)

        return NextResponse.json({
            success: true,
            data: {
                all: badgesWithStatus,
                displayed: displayedBadges,
                unlockedCount: studentBadges.length,
                totalCount: allBadges.length,
            },
        })
    } catch (error) {
        console.error('[API] 获取学生勋章失败:', error)
        return NextResponse.json(
            {
                success: false,
                error: '获取学生勋章失败',
            },
            { status: 500 }
        )
    }
}

// PUT /api/students/[id]/badges - 更新勋章显示顺序
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const studentId = params.id
        const body = await request.json()
        const { badgeIds } = body // [badgeId1, badgeId2, badgeId3]

        if (!Array.isArray(badgeIds) || badgeIds.length > 3) {
            return NextResponse.json(
                {
                    success: false,
                    error: '最多只能显示3个勋章',
                },
                { status: 400 }
            )
        }

        // 先将所有勋章设为不显示
        await prisma.student_badges.updateMany({
            where: { studentId },
            data: { isDisplayed: false, displayOrder: 0 },
        })

        // 更新选中的勋章
        for (let i = 0; i < badgeIds.length; i++) {
            await prisma.student_badges.updateMany({
                where: {
                    studentId,
                    badgeId: badgeIds[i],
                },
                data: {
                    isDisplayed: true,
                    displayOrder: i + 1,
                },
            })
        }

        return NextResponse.json({
            success: true,
            message: '勋章显示设置已更新',
        })
    } catch (error) {
        console.error('[API] 更新勋章显示失败:', error)
        return NextResponse.json(
            {
                success: false,
                error: '更新勋章显示失败',
            },
            { status: 500 }
        )
    }
}
