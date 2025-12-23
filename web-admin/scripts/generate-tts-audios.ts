import { PrismaClient } from '@prisma/client'
import * as fs from 'fs-extra'
import * as path from 'path'
import axios from 'axios'
import pLimit from 'p-limit'

const prisma = new PrismaClient()

// 配置
const CONFIG = {
    AUDIO_DIR: path.join(process.cwd(), '..', 'public', 'uploads', 'word-audios'),
    CONCURRENT_DOWNLOADS: 3, // 降低并发，避免被限流
    REQUEST_DELAY: 500, // 增加请求间隔
    MAX_RETRIES: 3,
    REQUEST_TIMEOUT: 15000,
}

interface DownloadStats {
    total: number
    success: number
    failed: number
    usDownloaded: number
    ukDownloaded: number
}

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 获取Google Translate TTS URL
 * 使用Google Translate的公开TTS服务
 */
function getGoogleTTSUrl(text: string, lang: 'en-US' | 'en-GB'): string {
    // 使用Google Translate的TTS API
    // tl: target language (en for English)
    // q: query text
    // client: tw-ob (web client)
    const encodedText = encodeURIComponent(text)
    const langCode = lang === 'en-US' ? 'en' : 'en-uk'
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodedText}`
}


/**
 * 下载音频文件
 */
async function downloadAudio(url: string, filepath: string, retries = 0): Promise<boolean> {
    try {
        console.log(`  ⬇ 下载音频...`)
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: CONFIG.REQUEST_TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })

        await fs.ensureDir(path.dirname(filepath))
        await fs.writeFile(filepath, response.data)

        const stats = await fs.stat(filepath)
        console.log(`  ✓ 已保存: ${(stats.size / 1024).toFixed(2)} KB`)

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
    console.log(`  ✓ 数据库记录已创建: ${accent}`)
}

/**
 * 处理单个单词
 */
async function processWord(
    word: string,
    vocabularyId: string,
    needUS: boolean,
    needUK: boolean,
    stats: DownloadStats,
    index: number,
    total: number
): Promise<void> {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`[${index + 1}/${total}] 处理单词: ${word}`)
    console.log(`需要: ${needUS ? '美式' : ''}${needUS && needUK ? ' + ' : ''}${needUK ? '英式' : ''}`)
    console.log('='.repeat(50))

    let usSuccess = false
    let ukSuccess = false

    try {
        // 生成美式发音
        if (needUS) {
            console.log(`\n🔊 生成美式发音...`)
            const usUrl = getGoogleTTSUrl(word, 'en-US')
            const filename = `${word}-us.mp3`
            const filepath = path.join(CONFIG.AUDIO_DIR, filename)
            const audioUrl = `/uploads/word-audios/${filename}`

            if (await downloadAudio(usUrl, filepath)) {
                await saveAudioToDatabase(vocabularyId, audioUrl, 'US')
                stats.usDownloaded++
                usSuccess = true
            }
        }

        // 等待一下，避免限流
        if (needUS && needUK) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY))
        }

        // 生成英式发音
        if (needUK) {
            console.log(`\n🔊 生成英式发音...`)
            const ukUrl = getGoogleTTSUrl(word, 'en-GB')
            const filename = `${word}-uk.mp3`
            const filepath = path.join(CONFIG.AUDIO_DIR, filename)
            const audioUrl = `/uploads/word-audios/${filename}`

            if (await downloadAudio(ukUrl, filepath)) {
                await saveAudioToDatabase(vocabularyId, audioUrl, 'UK')
                stats.ukDownloaded++
                ukSuccess = true
            }
        }

        // 更新统计
        if ((needUS && usSuccess) || (needUK && ukSuccess)) {
            stats.success++
        } else if (!usSuccess && !ukSuccess) {
            stats.failed++
        }

    } catch (error) {
        console.error(`\n✗ 处理 "${word}" 时出错:`, error instanceof Error ? error.message : error)
        stats.failed++
    }

    // 请求间隔
    await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY))
}

/**
 * 主函数
 */
async function generateTTSAudios() {
    try {
        console.log('=========================================')
        console.log('  Google TTS 音频生成工具')
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

        // 显示前10个单词
        console.log('待处理单词示例（前10个）:')
        wordsToProcess.slice(0, 10).forEach((w, i) => {
            console.log(`  ${i + 1}. ${w.word} (${w.needUS ? 'US' : ''}${w.needUS && w.needUK ? '+' : ''}${w.needUK ? 'UK' : ''})`)
        })
        console.log('')

        // 统计信息
        const stats: DownloadStats = {
            total: wordsToProcess.length,
            success: 0,
            failed: 0,
            usDownloaded: 0,
            ukDownloaded: 0,
        }

        // 并发控制
        const limit = pLimit(CONFIG.CONCURRENT_DOWNLOADS)

        console.log('开始生成音频...\n')
        console.log('=========================================')

        // 批量处理
        const tasks = wordsToProcess.map((item, index) =>
            limit(async () => {
                await processWord(
                    item.word,
                    item.vocabularyId,
                    item.needUS,
                    item.needUK,
                    stats,
                    index,
                    wordsToProcess.length
                )
            })
        )

        await Promise.all(tasks)

        // 输出最终统计
        console.log('\n=========================================')
        console.log('✓ 生成完成!')
        console.log('=========================================')
        console.log(`总计处理: ${stats.total}`)
        console.log(`成功: ${stats.success}`)
        console.log(`失败: ${stats.failed}`)
        console.log(`美式发音生成: ${stats.usDownloaded}`)
        console.log(`英式发音生成: ${stats.ukDownloaded}`)
        console.log(`总音频文件: ${stats.usDownloaded + stats.ukDownloaded}`)
        console.log('=========================================\n')

        // 保存失败列表
        if (stats.failed > 0) {
            const failedFile = path.join(process.cwd(), '..', 'failed-tts-generation.json')
            await fs.writeJSON(failedFile, {
                generatedAt: new Date().toISOString(),
                count: stats.failed,
                note: '这些单词的TTS音频生成失败',
            }, { spaces: 2 })

            console.log(`⚠ 失败记录已保存到: ${failedFile}\n`)
        }

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    generateTTSAudios()
}
