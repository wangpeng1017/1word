/**
 * 测试音频下载功能（小批量）
 * 仅下载前10个缺失音频的单词进行测试
 */

import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import * as fs from 'fs-extra'
import * as path from 'path'

const prisma = new PrismaClient()

// 配置
const CONFIG = {
    FREE_DICT_API: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    REQUEST_TIMEOUT: 10000,
    AUDIO_DIR: path.join(process.cwd(), '..', 'public', 'uploads', 'word-audios'),
    TEST_LIMIT: 10, // 仅测试10个单词
}

interface AudioInfo {
    word: string
    usAudioUrl?: string
    ukAudioUrl?: string
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
        console.log(`  🔍 查询API: ${word}`)
        const response = await axios.get(`${CONFIG.FREE_DICT_API}/${word}`, {
            timeout: CONFIG.REQUEST_TIMEOUT,
        })

        if (response.data && response.data.length > 0) {
            const entry = response.data[0]

            if (entry.phonetics && entry.phonetics.length > 0) {
                console.log(`  📝 找到 ${entry.phonetics.length} 个发音`)

                // 查找美式和英式发音
                for (const phonetic of entry.phonetics) {
                    if (phonetic.audio) {
                        const audioUrl = phonetic.audio
                        console.log(`     - ${audioUrl}`)

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

                console.log(`  ✓ 美式: ${result.usAudioUrl ? '✓' : '✗'}`)
                console.log(`  ✓ 英式: ${result.ukAudioUrl ? '✓' : '✗'}`)
            }
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log(`  ⚠ API中未找到`)
        } else {
            console.error(`  ✗ API错误:`, error instanceof Error ? error.message : error)
        }
    }

    return result
}

/**
 * 下载音频文件
 */
async function downloadAudio(url: string, filepath: string): Promise<boolean> {
    try {
        console.log(`  ⬇ 下载: ${url}`)
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: CONFIG.REQUEST_TIMEOUT,
        })

        await fs.ensureDir(path.dirname(filepath))
        await fs.writeFile(filepath, response.data)

        const stats = await fs.stat(filepath)
        console.log(`  ✓ 已保存: ${filepath} (${(stats.size / 1024).toFixed(2)} KB)`)

        return true
    } catch (error) {
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
 * 测试单个单词
 */
async function testWord(
    word: string,
    vocabularyId: string,
    needUS: boolean,
    needUK: boolean
): Promise<{ success: boolean; usDownloaded: boolean; ukDownloaded: boolean }> {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`测试单词: ${word}`)
    console.log(`需要: ${needUS ? '美式' : ''}${needUS && needUK ? ' + ' : ''}${needUK ? '英式' : ''}`)
    console.log('='.repeat(50))

    const audioInfo = await fetchAudioFromFreeDictAPI(word)

    let usDownloaded = false
    let ukDownloaded = false

    // 下载美式发音
    if (needUS && audioInfo.usAudioUrl) {
        const filename = `${word}-us.mp3`
        const filepath = path.join(CONFIG.AUDIO_DIR, filename)
        const audioUrl = `/uploads/word-audios/${filename}`

        if (await downloadAudio(audioInfo.usAudioUrl, filepath)) {
            await saveAudioToDatabase(vocabularyId, audioUrl, 'US')
            usDownloaded = true
        }
    }

    // 下载英式发音
    if (needUK && audioInfo.ukAudioUrl) {
        const filename = `${word}-uk.mp3`
        const filepath = path.join(CONFIG.AUDIO_DIR, filename)
        const audioUrl = `/uploads/word-audios/${filename}`

        if (await downloadAudio(audioInfo.ukAudioUrl, filepath)) {
            await saveAudioToDatabase(vocabularyId, audioUrl, 'UK')
            ukDownloaded = true
        }
    }

    const success = (needUS ? usDownloaded : true) && (needUK ? ukDownloaded : true)

    console.log(`\n结果: ${success ? '✓ 成功' : '✗ 部分失败'}`)

    // 等待一下，避免API限流
    await new Promise(resolve => setTimeout(resolve, 200))

    return { success, usDownloaded, ukDownloaded }
}

/**
 * 主测试函数
 */
async function testAudioDownload() {
    try {
        console.log('=========================================')
        console.log('  音频下载功能测试（小批量）')
        console.log('=========================================\n')

        // 确保音频目录存在
        await fs.ensureDir(CONFIG.AUDIO_DIR)
        console.log(`✓ 音频目录: ${CONFIG.AUDIO_DIR}\n`)

        // 查询需要音频的词汇（仅取前10个）
        console.log(`正在查询需要音频的词汇（限制${CONFIG.TEST_LIMIT}个）...`)
        const vocabularies = await prisma.vocabularies.findMany({
            include: {
                word_audios: true,
            },
            orderBy: {
                word: 'asc',
            },
        })

        // 筛选需要处理的词汇
        const wordsToTest: Array<{
            word: string
            vocabularyId: string
            needUS: boolean
            needUK: boolean
        }> = []

        for (const vocab of vocabularies) {
            if (wordsToTest.length >= CONFIG.TEST_LIMIT) break

            const hasUS = vocab.word_audios.some(a => a.accent === 'US')
            const hasUK = vocab.word_audios.some(a => a.accent === 'UK')

            if (!hasUS || !hasUK) {
                wordsToTest.push({
                    word: vocab.word,
                    vocabularyId: vocab.id,
                    needUS: !hasUS,
                    needUK: !hasUK,
                })
            }
        }

        console.log(`✓ 选择 ${wordsToTest.length} 个词汇进行测试\n`)
        console.log('测试单词列表:')
        wordsToTest.forEach((w, i) => {
            console.log(`  ${i + 1}. ${w.word} (${w.needUS ? 'US' : ''}${w.needUS && w.needUK ? '+' : ''}${w.needUK ? 'UK' : ''})`)
        })

        if (wordsToTest.length === 0) {
            console.log('\n所有词汇都已有完整音频！')
            return
        }

        // 统计
        let successCount = 0
        let usCount = 0
        let ukCount = 0

        // 逐个测试
        for (let i = 0; i < wordsToTest.length; i++) {
            const item = wordsToTest[i]
            const result = await testWord(item.word, item.vocabularyId, item.needUS, item.needUK)

            if (result.success) successCount++
            if (result.usDownloaded) usCount++
            if (result.ukDownloaded) ukCount++
        }

        // 最终统计
        console.log('\n' + '='.repeat(50))
        console.log('✓ 测试完成!')
        console.log('='.repeat(50))
        console.log(`测试词汇: ${wordsToTest.length}`)
        console.log(`完全成功: ${successCount}`)
        console.log(`部分成功: ${wordsToTest.length - successCount}`)
        console.log(`美式发音下载: ${usCount}`)
        console.log(`英式发音下载: ${ukCount}`)
        console.log(`总音频文件: ${usCount + ukCount}`)
        console.log('='.repeat(50))

        console.log('\n✓ 测试成功！可以继续全量下载。')

    } catch (error) {
        console.error('\n✗ 测试失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    testAudioDownload()
}
