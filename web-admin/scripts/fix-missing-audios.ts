import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 从 Free Dictionary API 获取音频
async function fetchAudioFromDictionary(word: string): Promise<{ us?: string; uk?: string }> {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        if (!response.ok) return {}

        const data = await response.json()
        const phonetics = data[0]?.phonetics || []

        let usAudio: string | undefined
        let ukAudio: string | undefined

        for (const phonetic of phonetics) {
            if (phonetic.audio) {
                // 判断是美式还是英式
                if (phonetic.audio.includes('-us') || phonetic.audio.includes('_us')) {
                    usAudio = phonetic.audio
                } else if (phonetic.audio.includes('-uk') || phonetic.audio.includes('_uk')) {
                    ukAudio = phonetic.audio
                } else if (!usAudio) {
                    usAudio = phonetic.audio // 默认作为美式
                }
            }
        }

        return { us: usAudio, uk: ukAudio }
    } catch (error) {
        return {}
    }
}

async function fixMissingAudios() {
    console.log('=========================================')
    console.log('  补充缺失的音频')
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
        console.log(`处理: ${vocab.word}...`)

        const audios = await fetchAudioFromDictionary(vocab.word)

        if (audios.us || audios.uk) {
            // 创建音频记录
            if (audios.us) {
                await prisma.word_audios.create({
                    data: {
                        id: `wa_${Date.now()}_us_${Math.random().toString(36).substr(2, 9)}`,
                        vocabularyId: vocab.id,
                        audioUrl: audios.us,
                        accent: 'US'
                    }
                })
            }

            if (audios.uk) {
                await prisma.word_audios.create({
                    data: {
                        id: `wa_${Date.now()}_uk_${Math.random().toString(36).substr(2, 9)}`,
                        vocabularyId: vocab.id,
                        audioUrl: audios.uk,
                        accent: 'UK'
                    }
                })
            }

            successCount++
            console.log(`  ✓ 已添加音频: US=${audios.us ? '有' : '无'}, UK=${audios.uk ? '有' : '无'}`)
        } else {
            failCount++
            console.log(`  ✗ 未找到音频`)
        }

        // 添加延迟避免 API 限制
        await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n=========================================')
    console.log(`补充完成!`)
    console.log(`  成功: ${successCount}`)
    console.log(`  失败: ${failCount}`)
    console.log('=========================================')

    await prisma.$disconnect()
}

fixMissingAudios()
