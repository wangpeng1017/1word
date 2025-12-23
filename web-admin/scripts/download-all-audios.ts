/**
 * 批量下载并导入所有单词的音频
 * 使用 Free Dictionary API 获取高质量发音
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

interface PhoneticData {
    text?: string
    audio?: string
}

interface FreeDictionaryResponse {
    word: string
    phonetics?: PhoneticData[]
}

/**
 * 从 Free Dictionary API 获取音频
 */
async function fetchAudioFromFreeDictionary(word: string): Promise<{ us?: string, uk?: string }> {
    try {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        const response = await fetch(url)

        if (!response.ok) {
            return {}
        }

        const data = await response.json() as FreeDictionaryResponse[]

        if (!data || data.length === 0 || !data[0].phonetics) {
            return {}
        }

        const phonetics = data[0].phonetics
        let usAudio = ''
        let ukAudio = ''

        // 查找美式和英式发音
        for (const phonetic of phonetics) {
            if (phonetic.audio) {
                if (phonetic.audio.includes('-us.mp3') || phonetic.audio.includes('-us-')) {
                    usAudio = phonetic.audio
                } else if (phonetic.audio.includes('-uk.mp3') || phonetic.audio.includes('-uk-') || phonetic.audio.includes('-gb.mp3')) {
                    ukAudio = phonetic.audio
                } else if (!usAudio && !ukAudio) {
                    // 如果没有明确标记，第一个作为美式
                    usAudio = phonetic.audio
                }
            }
        }

        return { us: usAudio, uk: ukAudio }

    } catch (error) {
        console.error(`  获取音频失败: ${word}`, error instanceof Error ? error.message : '')
        return {}
    }
}

/**
 * 下载音频文件
 */
async function downloadAudio(audioUrl: string, word: string, accent: 'US' | 'UK'): Promise<string | null> {
    try {
        const response = await fetch(audioUrl)
        if (!response.ok) {
            return null
        }

        const buffer = await response.arrayBuffer()
        const filename = `${word.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${accent.toLowerCase()}.mp3`
        const filepath = path.join(process.cwd(), 'public/uploads/vocabulary-audios', filename)

        const dir = path.dirname(filepath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(filepath, Buffer.from(buffer))

        return `/uploads/vocabulary-audios/${filename}`

    } catch (error) {
        console.error(`  下载音频失败: ${word} (${accent})`, error instanceof Error ? error.message : '')
        return null
    }
}

/**
 * 备用：使用 Google TTS 获取音频
 */
async function fetchAudioFromGoogleTTS(word: string, accent: 'US' | 'UK'): Promise<string | null> {
    try {
        const tl = accent === 'US' ? 'en-US' : 'en-GB'
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=${tl}&client=tw-ob`

        const response = await fetch(url)
        if (!response.ok) {
            return null
        }

        const buffer = await response.arrayBuffer()
        const filename = `${word.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${accent.toLowerCase()}.mp3`
        const filepath = path.join(process.cwd(), 'public/uploads/vocabulary-audios', filename)

        const dir = path.dirname(filepath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(filepath, Buffer.from(buffer))

        return `/uploads/vocabulary-audios/${filename}`

    } catch (error) {
        return null
    }
}

/**
 * 为单词添加音频
 */
async function addAudioForWord(word: string, vocabularyId: string): Promise<{ us: boolean, uk: boolean }> {
    const result = { us: false, uk: false }

    try {
        // 检查是否已有音频
        const existingAudios = await prisma.word_audios.findMany({
            where: { vocabularyId }
        })

        const hasUS = existingAudios.some(a => a.accent === 'US')
        const hasUK = existingAudios.some(a => a.accent === 'UK')

        if (hasUS && hasUK) {
            return { us: true, uk: true }  // 已经有完整音频
        }

        // 1. 优先尝试 Free Dictionary API
        const audioUrls = await fetchAudioFromFreeDictionary(word)

        // 添加美式发音
        if (!hasUS) {
            let audioPath: string | null = null

            if (audioUrls.us) {
                audioPath = await downloadAudio(audioUrls.us, word, 'US')
            }

            // 如果失败，尝试 Google TTS
            if (!audioPath) {
                audioPath = await fetchAudioFromGoogleTTS(word, 'US')
            }

            if (audioPath) {
                await prisma.word_audios.create({
                    data: {
                        id: generateId('audio'),
                        vocabularyId,
                        audioUrl: audioPath,
                        accent: 'US'
                    }
                })
                result.us = true
            }
        } else {
            result.us = true
        }

        // 添加英式发音
        if (!hasUK) {
            let audioPath: string | null = null

            if (audioUrls.uk) {
                audioPath = await downloadAudio(audioUrls.uk, word, 'UK')
            }

            // 如果失败，尝试 Google TTS
            if (!audioPath) {
                audioPath = await fetchAudioFromGoogleTTS(word, 'UK')
            }

            if (audioPath) {
                await prisma.word_audios.create({
                    data: {
                        id: generateId('audio'),
                        vocabularyId,
                        audioUrl: audioPath,
                        accent: 'UK'
                    }
                })
                result.uk = true
            }
        } else {
            result.uk = true
        }

    } catch (error) {
        console.error(`  处理音频失败: ${word}`, error instanceof Error ? error.message : '')
    }

    return result
}

async function main() {
    try {
        console.log('===========================================')
        console.log('  批量下载所有单词音频')
        console.log('===========================================\n')

        // 获取所有单词
        const vocabularies = await prisma.vocabularies.findMany({
            select: {
                id: true,
                word: true
            },
            orderBy: {
                word: 'asc'
            }
        })

        console.log(`✓ 找到 ${vocabularies.length} 个单词\n`)
        console.log('开始下载音频...\n')

        let totalCount = 0
        let successUS = 0
        let successUK = 0
        let failedCount = 0

        for (let i = 0; i < vocabularies.length; i++) {
            const vocab = vocabularies[i]
            totalCount++

            if ((i + 1) % 50 === 0 || i === 0) {
                console.log(`[${i + 1}/${vocabularies.length}] 处理: ${vocab.word}`)
            }

            const result = await addAudioForWord(vocab.word, vocab.id)

            if (result.us) successUS++
            if (result.uk) successUK++
            if (!result.us && !result.uk) failedCount++

            // 每100个词显示进度
            if ((i + 1) % 100 === 0) {
                console.log(`\n进度: ${i + 1}/${vocabularies.length}`)
                console.log(`  美式音频: ${successUS}, 英式音频: ${successUK}, 失败: ${failedCount}\n`)
            }

            // 延迟避免API限频
            if (i % 10 === 0 && i > 0) {
                await delay(500)
            }
        }

        console.log('\n===========================================')
        console.log('✓ 音频下载完成!')
        console.log(`  总计单词: ${totalCount}`)
        console.log(`  美式音频: ${successUS}`)
        console.log(`  英式音频: ${successUK}`)
        console.log(`  完全失败: ${failedCount}`)
        console.log('===========================================')

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    main()
}
