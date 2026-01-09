/**
 * @file route.ts
 * @desc 勋章API - 获取所有勋章定义
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/badges - 获取所有勋章
export async function GET(request: NextRequest) {
    try {
        const badges = await prisma.badges.findMany({
            where: {
                isActive: true,
            },
            orderBy: [
                { rarity: 'desc' }, // 按稀有度排序
                { createdAt: 'asc' },
            ],
        })

        return NextResponse.json({
            success: true,
            data: badges,
        })
    } catch (error) {
        console.error('[API] 获取勋章列表失败:', error)
        return NextResponse.json(
            {
                success: false,
                error: '获取勋章列表失败',
            },
            { status: 500 }
        )
    }
}
