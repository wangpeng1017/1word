import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Google Oxford 字典的音频 URL 格式
function buildGoogleAudioUrl(word: string, accent: 'US' | 'UK'): string {
    const suffix = accent === 'US' ? '--_us_1.mp3' : '--_gb_1.mp3'
    return `https://ssl.gstatic.com/dictionary/static/sounds/oxford/${word}${suffix}`
}

// 检查 URL 是否可访问
async function checkAudioUrl(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' })
        return response.ok
    } catch {
        return false
    }
}

async function fixMissingAudiosWithGoogle() {
    console.log('=========================================')
    console.log('  使用 Google Oxford 补充缺失的音频')
    console.log('=========================================\n')

    // 获取缺少音频的 R 开头词汇
    const vocabsWithoutAudio = await prisma.vocabularies.findMany({
        where: {
            word: { startsWith: 'r' },
            word_audios: { none: {} }
        },
        orderBy: { word: 'asc' }
    })

    console.log(`需要补充音频的词汇: ${vocabsWithoutAudio.length} 个\n`)

    let successCount = 0
    let failCount = 0

    for (const vocab of vocabsWithoutAudio) {
        const word = vocab.word.toLowerCase()
        console.log(`处理: ${word}...`)

        const usUrl = buildGoogleAudioUrl(word, 'US')
        const ukUrl = buildGoogleAudioUrl(word, 'UK')

        const usExists = await checkAudioUrl(usUrl)
        const ukExists = await checkAudioUrl(ukUrl)

        if (usExists || ukExists) {
            // 创建音频记录
            if (usExists) {
                await prisma.word_audios.create({
                    data: {
                        id: `wa_${Date.now()}_us_${Math.random().toString(36).substr(2, 9)}`,
                        vocabularyId: vocab.id,
                        audioUrl: usUrl,
                        accent: 'US'
                    }
                })
            }

            if (ukExists) {
                await prisma.word_audios.create({
                    data: {
                        id: `wa_${Date.now()}_uk_${Math.random().toString(36).substr(2, 9)}`,
                        vocabularyId: vocab.id,
                        audioUrl: ukUrl,
                        accent: 'UK'
                    }
                })
            }

            successCount++
            console.log(`  ✓ 已添加: US=${usExists ? '有' : '无'}, UK=${ukExists ? '有' : '无'}`)
        } else {
            failCount++
            console.log(`  ✗ 未找到音频`)
        }

        // 添加延迟
        await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log('\n=========================================')
    console.log(`补充完成!`)
    console.log(`  成功: ${successCount}`)
    console.log(`  失败: ${failCount}`)
    console.log('=========================================')

    await prisma.$disconnect()
}

fixMissingAudiosWithGoogle()
