/**
 * @file enrich-non-r-words.js
 * @desc 为非R开头的单词完善音标和音频数据（JavaScript版本）
 */

const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

// 配置
const CONFIG = {
    FREE_DICT_API: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    YOUDAO_AUDIO_US: 'https://dict.youdao.com/dictvoice?audio=',
    REQUEST_TIMEOUT: 10000,
    BATCH_SIZE: 50,
    REQUEST_DELAY: 200,
    MAX_RETRIES: 2,
}

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchFromFreeDictAPI(word, retries = 0) {
    try {
        const response = await axios.get(`${CONFIG.FREE_DICT_API}/${encodeURIComponent(word)}`, {
            timeout: CONFIG.REQUEST_TIMEOUT,
        })

        if (response.data && response.data.length > 0) {
            const entry = response.data[0]
            const result = {}

            if (entry.phonetic) {
                result.phonetic = entry.phonetic
            }

            if (entry.phonetics && entry.phonetics.length > 0) {
                for (const phonetic of entry.phonetics) {
                    const text = phonetic.text || ''
                    const audio = phonetic.audio || ''

                    if (audio.includes('-us.mp3') || audio.includes('/us/')) {
                        if (!result.phonetic_us && text) result.phonetic_us = text
                        if (!result.audio_us && audio) result.audio_us = audio
                    } else if (audio.includes('-uk.mp3') || audio.includes('/uk/')) {
                        if (!result.phonetic_uk && text) result.phonetic_uk = text
                        if (!result.audio_uk && audio) result.audio_uk = audio
                    } else if (!audio.includes('-au.mp3') && !audio.includes('/au/')) {
                        if (!result.phonetic_us && text) result.phonetic_us = text
                        if (!result.audio_us && audio) result.audio_us = audio
                    }
                }
            }

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
        if (error.response?.status === 404) {
            return null
        }
        if (retries < CONFIG.MAX_RETRIES) {
            await delay(1000 * (retries + 1))
            return fetchFromFreeDictAPI(word, retries + 1)
        }
        return null
    }
}

function getYoudaoAudioUrl(word, type) {
    const typeNum = type === 'US' ? 1 : 2
    return `${CONFIG.YOUDAO_AUDIO_US}${encodeURIComponent(word)}&type=${typeNum}`
}

async function processWord(vocab, stats) {
    const { id, word } = vocab
    const info = await fetchFromFreeDictAPI(word)

    if (info) {
        const updateData = {}
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
        stats.failed++
    }
}

async function main() {
    console.log('=========================================')
    console.log('  非R开头单词数据完善工具')
    console.log('=========================================\n')

    try {
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
                    console.log('✗', error.message)
                    stats.failed++
                }

                await delay(CONFIG.REQUEST_DELAY)
            }

            if (batch < batches - 1) {
                console.log(`\n等待 2 秒后继续下一批次...`)
                await delay(2000)
            }
        }

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
