import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const key = searchParams.get('key')

    // 简单验证
    if (key !== 'emergency2024') {
        return NextResponse.json({ success: false, error: 'Invalid key' })
    }

    try {
        if (action === 'check') {
            const count = await prisma.vocabularies.count()
            return NextResponse.json({
                success: true,
                vocabularyCount: count,
                message: count > 0 ? '数据库有数据' : '数据库为空'
            })
        }

        if (action === 'restore') {
            // 创建示例词汇用于验证
            const words = [
                { word: 'abandon', meaning: '放弃，抛弃' },
                { word: 'ability', meaning: '能力，才能' },
                { word: 'able', meaning: '能够的' },
                { word: 'about', meaning: '关于，大约' },
                { word: 'above', meaning: '在上面' },
            ]

            let created = 0
            for (const w of words) {
                const exists = await prisma.vocabularies.findFirst({ where: { word: w.word } })
                if (!exists) {
                    await prisma.vocabularies.create({
                        data: {
                            id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            word: w.word,
                            primary_meaning: w.meaning,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    })
                    created++
                }
            }

            const total = await prisma.vocabularies.count()
            return NextResponse.json({ success: true, created, total })
        }

        return NextResponse.json({ error: 'action=check or action=restore' })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown'
        })
    } finally {
        await prisma.$disconnect()
    }
}
