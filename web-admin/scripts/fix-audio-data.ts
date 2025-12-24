import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 为所有词汇补充音频数据
 * 从 Free Dictionary API 获取音频链接
 */

interface AudioResponse {
    word: string
    phonetics: Array<{
        text?: string
        audio?: string
    }>
}

async function fetchAudioUrl(word: string, accent: 'US' | 'UK' = 'US'): Promise<string | null> {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        if (!response.ok) return null

        const data: AudioResponse[] = await response.json()
        if (!data || data.length === 0) return null

        // 查找音频链接
        for (const entry of data) {
            if (entry.phonetics) {
                for (const phonetic of entry.phonetics) {
                    if (phonetic.audio) {
                        // 优先选择对应口音的音频
                        if (accent === 'US' && phonetic.audio.includes('-us.mp3')) {
                            return phonetic.audio
                        }
                        if (accent === 'UK' && phonetic.audio.includes('-uk.mp3')) {
                            return phonetic.audio
                        }
                    }
                }
                // 如果没有找到特定口音，返回第一个可用的音频
                for (const phonetic of entry.phonetics) {
                    if (phonetic.audio) {
                        return phonetic.audio
                    }
                }
            }
        }
        return null
    } catch (error) {
        console.error(`获取 ${word} 的音频失败:`, error)
        return null
    }
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function fixAudioData() {
    console.log('=========================================')
    console.log('  补充音频数据')
    console.log('=========================================\n')

    try {
        // 获取所有没有音频的词汇
        const vocabsWithoutAudio = await prisma.vocabularies.findMany({
            where: {
                word_audios: {
                    none: {}
                }
            },
            select: {
                id: true,
                word: true
            }
        })

        console.log(`找到 ${vocabsWithoutAudio.length} 个没有音频的词汇\n`)

        if (vocabsWithoutAudio.length === 0) {
            console.log('✓ 所有词汇都已有音频记录')
            return
        }

        let successCount = 0
        let failCount = 0

        for (let i = 0; i < vocabsWithoutAudio.length; i++) {
            const vocab = vocabsWithoutAudio[i]

            try {
                // 获取美式音频
                const audioUrl = await fetchAudioUrl(vocab.word, 'US')

                if (audioUrl) {
                    await prisma.word_audios.create({
                        data: {
                            id: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            vocabularyId: vocab.id,
                            audioUrl: audioUrl,
                            accent: 'US',
                        }
                    })
                    successCount++
                    console.log(`✓ [${i + 1}/${vocabsWithoutAudio.length}] ${vocab.word}: 已添加音频`)
                } else {
                    failCount++
                    console.log(`✗ [${i + 1}/${vocabsWithoutAudio.length}] ${vocab.word}: 未找到音频`)
                }

                // 延迟避免API限流
                if ((i + 1) % 10 === 0) {
                    console.log(`  暂停 2 秒...`)
                    await delay(2000)
                } else {
                    await delay(500)
                }

            } catch (error) {
                failCount++
                console.error(`✗ [${i + 1}/${vocabsWithoutAudio.length}] ${vocab.word}: 处理失败`, error)
            }
        }

        console.log('\n=========================================')
        console.log('✓ 音频数据补充完成!')
        console.log(`  成功: ${successCount}`)
        console.log(`  失败: ${failCount}`)
        console.log('=========================================\n')

    } catch (error) {
        console.error('✗ 执行失败:', error)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    fixAudioData()
}

export { fixAudioData }
