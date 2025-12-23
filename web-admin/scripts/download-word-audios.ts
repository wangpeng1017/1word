/**
 * 下载词汇音频文件
 * 使用Free Dictionary API获取音频，备用Google TTS
 */

import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import * as fs from 'fs-extra'
import * as path from 'path'
import pLimit from 'p-limit'

const prisma = new PrismaClient()

// 配置
const CONFIG = {
    FREE_DICT_API: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    REQUEST_TIMEOUT: 10000,
    MAX_RETRIES: 3,
    CONCURRENT_DOWNLOADS: 5,
    AUDIO_DIR: path.join(process.cwd(), '..', 'public', 'uploads', 'word-audios'),
    REQUEST_DELAY: 100, // 请求间隔，避免API限流
}

interface AudioInfo {
    word: string
    usAudioUrl?: string
    ukAudioUrl?: string
}

interface DownloadStats {
    total: number
    success: number
    failed: number
    skipped: number
    usDownloaded: number
    ukDownloaded: number
}

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 从Free Dictionary API获取音频URL
 */
async function fetchAudioFromFreeDictAPI(word: string): Promise<AudioInfo> {
    const result: AudioInfo = { word }

    try {
        const response = await axios.get(`${CONFIG.FREE_DICT_API}/${word}`, {
            timeout: CONFIG.REQUEST_TIMEOUT,
        })

        if (response.data && response.data.length > 0) {
            const entry = response.data[0]

            if (entry.phonetics && entry.phonetics.length > 0) {
                // 查找美式和英式发音
                for (const phonetic of entry.phonetics) {
                    if (phonetic.audio) {
                        const audioUrl = phonetic.audio

                        // 判断是美式还是英式
                        if (audioUrl.includes('-us.mp3') || audioUrl.includes('/us/')) {
                            result.usAudioUrl = audioUrl
                        } else if (audioUrl.includes('-uk.mp3') || audioUrl.includes('/uk/')) {
                            result.ukAudioUrl = audioUrl
                        } else if (!result.usAudioUrl) {
                            // 如果无法判断，默认作为美式发音
                            result.usAudioUrl = audioUrl
                        }
                    }
                }
            }
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log(`  ⚠ 单词 "${word}" 在API中未找到`)
        } else {
            console.error(`  ✗ 获取 "${word}" 音频URL失败:`, error instanceof Error ? error.message : error)
        }
    }

    return result
}

/**
 * 下载音频文件
 */
async function downloadAudio(url: string, filepath: string, retries = 0): Promise<boolean> {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: CONFIG.REQUEST_TIMEOUT,
        })

        await fs.ensureDir(path.dirname(filepath))
        await fs.writeFile(filepath, response.data)

        return true
    } catch (error) {
        if (retries < CONFIG.MAX_RETRIES) {
            console.log(`  ⟳ 重试下载 (${retries + 1}/${CONFIG.MAX_RETRIES})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
            return downloadAudio(url, filepath, retries + 1)
        }

        console.error(`  ✗ 下载失败:`, error instanceof Error ? error.message : error)
        return false
    }
}

/**
 * 保存音频到数据库
 */
async function saveAudioToDatabase(
    vocabularyId: string,
    audioUrl: string,
    accent: 'US' | 'UK'
): Promise<void> {
    await prisma.word_audios.create({
        data: {
            id: generateId('audio'),
            vocabularyId,
            audioUrl,
            accent,
        },
    })
}

/**
 * 处理单个单词
 */
async function processWord(
    word: string,
    vocabularyId: string,
    needUS: boolean,
    needUK: boolean,
    stats: DownloadStats
): Promise<void> {
    console.log(`\n处理单词: ${word}`)
    console.log(`  需要: ${needUS ? '美式' : ''}${needUS && needUK ? ' + ' : ''}${needUK ? '英式' : ''}`)

    // 从API获取音频URL
    const audioInfo = await fetchAudioFromFreeDictAPI(word)

    let usSuccess = false
    let ukSuccess = false

    // 下载美式发音
    if (needUS && audioInfo.usAudioUrl) {
        const filename = `${word}-us.mp3`
        const filepath = path.join(CONFIG.AUDIO_DIR, filename)
        const audioUrl = `/uploads/word-audios/${filename}`

        console.log(`  ⬇ 下载美式发音...`)
        if (await downloadAudio(audioInfo.usAudioUrl, filepath)) {
            await saveAudioToDatabase(vocabularyId, audioUrl, 'US')
            console.log(`  ✓ 美式发音已保存`)
            stats.usDownloaded++
            usSuccess = true
        }
    } else if (needUS) {
        console.log(`  ⚠ 未找到美式发音URL`)
    }

    // 下载英式发音
    if (needUK && audioInfo.ukAudioUrl) {
        const filename = `${word}-uk.mp3`
        const filepath = path.join(CONFIG.AUDIO_DIR, filename)
        const audioUrl = `/uploads/word-audios/${filename}`

        console.log(`  ⬇ 下载英式发音...`)
        if (await downloadAudio(audioInfo.ukAudioUrl, filepath)) {
            await saveAudioToDatabase(vocabularyId, audioUrl, 'UK')
            console.log(`  ✓ 英式发音已保存`)
            stats.ukDownloaded++
            ukSuccess = true
        }
    } else if (needUK) {
        console.log(`  ⚠ 未找到英式发音URL`)
    }

    // 更新统计
    if ((needUS && usSuccess) || (needUK && ukSuccess)) {
        stats.success++
    } else if (!usSuccess && !ukSuccess) {
        stats.failed++
    }

    // 请求间隔
    await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY))
}

/**
 * 主函数
 */
async function downloadWordAudios() {
    try {
        console.log('=========================================')
        console.log('  词汇音频下载工具')
        console.log('=========================================\n')

        // 确保音频目录存在
        await fs.ensureDir(CONFIG.AUDIO_DIR)
        console.log(`✓ 音频目录: ${CONFIG.AUDIO_DIR}\n`)

        // 查询需要音频的词汇
        console.log('正在查询需要音频的词汇...')
        const vocabularies = await prisma.vocabularies.findMany({
            include: {
                word_audios: true,
            },
            orderBy: {
                word: 'asc',
            },
        })

        // 筛选需要处理的词汇
        const wordsToProcess: Array<{
            word: string
            vocabularyId: string
            needUS: boolean
            needUK: boolean
        }> = []

        for (const vocab of vocabularies) {
            const hasUS = vocab.word_audios.some(a => a.accent === 'US')
            const hasUK = vocab.word_audios.some(a => a.accent === 'UK')

            if (!hasUS || !hasUK) {
                wordsToProcess.push({
                    word: vocab.word,
                    vocabularyId: vocab.id,
                    needUS: !hasUS,
                    needUK: !hasUK,
                })
            }
        }

        console.log(`✓ 找到 ${wordsToProcess.length} 个需要处理的词汇\n`)

        if (wordsToProcess.length === 0) {
            console.log('所有词汇都已有完整音频！')
            return
        }

        // 统计信息
        const stats: DownloadStats = {
            total: wordsToProcess.length,
            success: 0,
            failed: 0,
            skipped: 0,
            usDownloaded: 0,
            ukDownloaded: 0,
        }

        // 并发控制
        const limit = pLimit(CONFIG.CONCURRENT_DOWNLOADS)

        console.log('开始下载音频...\n')
        console.log('=========================================')

        // 批量处理
        const tasks = wordsToProcess.map((item, index) =>
            limit(async () => {
                console.log(`\n[${index + 1}/${wordsToProcess.length}]`)
                await processWord(
                    item.word,
                    item.vocabularyId,
                    item.needUS,
                    item.needUK,
                    stats
                )
            })
        )

        await Promise.all(tasks)

        // 输出最终统计
        console.log('\n=========================================')
        console.log('✓ 下载完成!')
        console.log('=========================================')
        console.log(`总计处理: ${stats.total}`)
        console.log(`成功: ${stats.success}`)
        console.log(`失败: ${stats.failed}`)
        console.log(`跳过: ${stats.skipped}`)
        console.log(`美式发音下载: ${stats.usDownloaded}`)
        console.log(`英式发音下载: ${stats.ukDownloaded}`)
        console.log(`总音频文件: ${stats.usDownloaded + stats.ukDownloaded}`)
        console.log('=========================================\n')

        // 保存失败列表
        if (stats.failed > 0) {
            const failedWords = wordsToProcess
                .filter((_, index) => index < stats.failed)
                .map(w => w.word)

            const failedFile = path.join(process.cwd(), '..', 'failed-audio-downloads.json')
            await fs.writeJSON(failedFile, {
                generatedAt: new Date().toISOString(),
                count: stats.failed,
                words: failedWords,
            }, { spaces: 2 })

            console.log(`⚠ 失败单词列表已保存到: ${failedFile}\n`)
        }

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    downloadWordAudios()
}
