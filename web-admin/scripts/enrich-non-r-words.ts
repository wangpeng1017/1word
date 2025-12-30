/**
 * @file enrich-non-r-words.ts
 * @desc 为非R开头的单词完善音标和音频数据
 * @input 依赖: Free Dictionary API, 数据库
 * @output 更新vocabularies表音标字段，创建word_audios记录
 */

import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

// 配置
const CONFIG = {
    FREE_DICT_API: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    YOUDAO_AUDIO_US: 'https://dict.youdao.com/dictvoice?audio=',
    REQUEST_TIMEOUT: 10000,
    BATCH_SIZE: 50,        // 每批处理数量
    REQUEST_DELAY: 200,    // 请求间隔（毫秒）
    MAX_RETRIES: 2,
}

interface PhoneticInfo {
    phonetic?: string
    phonetic_us?: string
    phonetic_uk?: string
    audio_us?: string
    audio_uk?: string
}

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 从 Free Dictionary API 获取音标和音频信息
 */
async function fetchFromFreeDictAPI(word: string, retries = 0): Promise<PhoneticInfo | null> {
    try {
        const response = await axios.get(`${CONFIG.FREE_DICT_API}/${encodeURIComponent(word)}`, {
            timeout: CONFIG.REQUEST_TIMEOUT,
        })

        if (response.data && response.data.length > 0) {
            const entry = response.data[0]
            const result: PhoneticInfo = {}

            // 获取主音标
            if (entry.phonetic) {
                result.phonetic = entry.phonetic
            }

            // 遍历 phonetics 数组获取美式和英式发音
            if (entry.phonetics && entry.phonetics.length > 0) {
                for (const phonetic of entry.phonetics) {
                    const text = phonetic.text || ''
                    const audio = phonetic.audio || ''

                    // 判断是美式还是英式
                    if (audio.includes('-us.mp3') || audio.includes('/us/')) {
                        if (!result.phonetic_us && text) result.phonetic_us = text
                        if (!result.audio_us && audio) result.audio_us = audio
                    } else if (audio.includes('-uk.mp3') || audio.includes('/uk/')) {
                        if (!result.phonetic_uk && text) result.phonetic_uk = text
                        if (!result.audio_uk && audio) result.audio_uk = audio
                    } else if (audio.includes('-au.mp3') || audio.includes('/au/')) {
                        // 跳过澳式发音
                    } else {
                        // 无法判断的，如果还没有美式音标就作为美式
                        if (!result.phonetic_us && text) result.phonetic_us = text
                        if (!result.audio_us && audio) result.audio_us = audio
                    }
                }
            }

            // 如果没有获取到分类音标，用主音标填充
            if (!result.phonetic_us && result.phonetic) {
                result.phonetic_us = result.phonetic
            }
            if (!result.phonetic_uk && result.phonetic) {
                result.phonetic_uk = result.phonetic
            }

            return result
        }
        return null
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) {
                // 单词未找到，不重试
                return null
            }
            if (retries < CONFIG.MAX_RETRIES) {
                await delay(1000 * (retries + 1))
                return fetchFromFreeDictAPI(word, retries + 1)
            }
        }
        return null
    }
}

/**
 * 获取有道词典音频URL
 */
function getYoudaoAudioUrl(word: string, type: 'US' | 'UK'): string {
    // type=1 美式, type=2 英式
    const typeNum = type === 'US' ? 1 : 2
    return `${CONFIG.YOUDAO_AUDIO_US}${encodeURIComponent(word)}&type=${typeNum}`
}

/**
 * 处理单个单词
 */
async function processWord(
    vocab: { id: string; word: string },
    stats: { updated: number; audioAdded: number; failed: number }
): Promise<void> {
    const { id, word } = vocab

    // 从 Free Dictionary API 获取数据
    const info = await fetchFromFreeDictAPI(word)

    if (info) {
        // 更新音标
        const updateData: any = {}
        if (info.phonetic) updateData.phonetic = info.phonetic
        if (info.phonetic_us) updateData.phonetic_us = info.phonetic_us
        if (info.phonetic_uk) updateData.phonetic_uk = info.phonetic_uk

        if (Object.keys(updateData).length > 0) {
            await prisma.vocabularies.update({
                where: { id },
                data: updateData,
            })
            stats.updated++
        }

        // 添加音频记录
        if (info.audio_us) {
            await prisma.word_audios.create({
                data: {
                    id: generateId('audio'),
                    vocabularyId: id,
                    audioUrl: info.audio_us,
                    accent: 'US',
                },
            })
            stats.audioAdded++
        }

        if (info.audio_uk) {
            await prisma.word_audios.create({
                data: {
                    id: generateId('audio'),
                    vocabularyId: id,
                    audioUrl: info.audio_uk,
                    accent: 'UK',
                },
            })
            stats.audioAdded++
        }
    } else {
        // Free Dictionary API 未找到，使用有道词典音频作为备用
        const youdaoUsUrl = getYoudaoAudioUrl(word, 'US')
        await prisma.word_audios.create({
            data: {
                id: generateId('audio'),
                vocabularyId: id,
                audioUrl: youdaoUsUrl,
                accent: 'US',
            },
        })
        stats.audioAdded++
        stats.failed++ // 标记为部分失败（没有音标）
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('=========================================')
    console.log('  非R开头单词数据完善工具')
    console.log('=========================================\n')

    try {
        // 查询所有非R开头且没有音标的词汇
        const vocabularies = await prisma.vocabularies.findMany({
            where: {
                AND: [
                    { NOT: { word: { startsWith: 'r' } } },
                    { NOT: { word: { startsWith: 'R' } } },
                    {
                        OR: [
                            { phonetic: null },
                            { phonetic: '' },
                        ]
                    }
                ]
            },
            select: {
                id: true,
                word: true,
            },
            orderBy: {
                word: 'asc',
            },
        })

        console.log(`找到 ${vocabularies.length} 个需要处理的词汇\n`)

        if (vocabularies.length === 0) {
            console.log('所有非R开头词汇都已有音标数据！')
            return
        }

        const stats = {
            updated: 0,
            audioAdded: 0,
            failed: 0,
        }

        // 分批处理
        const batches = Math.ceil(vocabularies.length / CONFIG.BATCH_SIZE)

        for (let batch = 0; batch < batches; batch++) {
            const start = batch * CONFIG.BATCH_SIZE
            const end = Math.min(start + CONFIG.BATCH_SIZE, vocabularies.length)
            const batchVocabs = vocabularies.slice(start, end)

            console.log(`\n[批次 ${batch + 1}/${batches}] 处理 ${start + 1}-${end}`)

            for (let i = 0; i < batchVocabs.length; i++) {
                const vocab = batchVocabs[i]
                const globalIndex = start + i + 1

                process.stdout.write(`  [${globalIndex}/${vocabularies.length}] ${vocab.word.padEnd(20)}`)

                try {
                    await processWord(vocab, stats)
                    console.log('✓')
                } catch (error) {
                    console.log('✗')
                    stats.failed++
                }

                // 请求间隔
                await delay(CONFIG.REQUEST_DELAY)
            }

            // 每批次之间额外等待
            if (batch < batches - 1) {
                console.log(`\n等待 2 秒后继续下一批次...`)
                await delay(2000)
            }
        }

        // 输出统计
        console.log('\n=========================================')
        console.log('✓ 处理完成!')
        console.log('=========================================')
        console.log(`更新音标: ${stats.updated} 个`)
        console.log(`添加音频: ${stats.audioAdded} 条`)
        console.log(`失败/部分失败: ${stats.failed} 个`)
        console.log('=========================================\n')

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
