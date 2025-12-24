import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 2000词汇数据（简化版 - 只含R开头的词汇，用于快速恢复测试）
const R_WORDS_DATA = [
    { word: 'racial', meaning: '种族的，人种的', partOfSpeech: 'adj.' },
    { word: 'racism', meaning: '种族主义；种族歧视', partOfSpeech: 'n.' },
    { word: 'radar', meaning: '雷达', partOfSpeech: 'n.' },
    { word: 'radiation', meaning: '辐射，放射线', partOfSpeech: 'n.' },
    { word: 'radium', meaning: '镭（元素符号Ra）', partOfSpeech: 'n.' },
    { word: 'random', meaning: '随机的，任意的', partOfSpeech: 'adj.' },
    { word: 'range', meaning: '范围；射程；山脉', partOfSpeech: 'n.' },
    { word: 'rank', meaning: '等级；军衔', partOfSpeech: 'n.' },
    { word: 'rapid', meaning: '快速的，迅速的', partOfSpeech: 'adj.' },
    { word: 'rare', meaning: '稀有的，罕见的', partOfSpeech: 'adj.' },
]

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const secret = searchParams.get('secret')

    // 简单的安全验证
    if (secret !== 'restore2024') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        if (action === 'check') {
            // 检查数据库状态
            const count = await prisma.vocabularies.count()
            return NextResponse.json({
                success: true,
                vocabularyCount: count,
                message: count > 0 ? '数据库正常' : '数据库为空，需要恢复'
            })
        }

        if (action === 'restore-sample') {
            // 恢复示例数据（R开头的10个词）
            let created = 0
            for (const vocab of R_WORDS_DATA) {
                const existing = await prisma.vocabularies.findFirst({
                    where: { word: vocab.word }
                })

                if (!existing) {
                    await prisma.vocabularies.create({
                        data: {
                            id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            word: vocab.word,
                            primary_meaning: vocab.meaning,
                            part_of_speech: vocab.partOfSpeech,
                            frequency: 1,
                            is_high_frequency: false,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    })
                    created++
                }
            }

            const total = await prisma.vocabularies.count()
            return NextResponse.json({
                success: true,
                created,
                total,
                message: `创建了 ${created} 个词汇，当前共 ${total} 个`
            })
        }

        return NextResponse.json({
            error: 'Unknown action',
            availableActions: ['check', 'restore-sample']
        }, { status: 400 })

    } catch (error) {
        return NextResponse.json({
            error: 'Database error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}
