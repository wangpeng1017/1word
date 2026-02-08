
/**
 * 下载词汇音频文件 (JS版)
 * 使用Free Dictionary API获取音频，备用Google TTS
 */

const { PrismaClient } = require('@prisma/client')
const axios = require('axios')
const fs = require('fs-extra')
const path = require('path')

const prisma = new PrismaClient()

// 配置
const CONFIG = {
    FREE_DICT_API: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    REQUEST_TIMEOUT: 10000,
    MAX_RETRIES: 5,
    CONCURRENT_DOWNLOADS: 1, // 保持低并发确保准确性
    AUDIO_DIR: path.join(process.cwd(), 'public', 'uploads', 'word-audios'),
    REQUEST_DELAY: 1500,
}

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 获取音频URL（支持多源回退）
 */
async function fetchAudioWithFallback(word) {
    const result = { word }

    // 1. 尝试 Free Dictionary API
    try {
        const response = await axios.get(`${CONFIG.FREE_DICT_API}/${word}`, { timeout: 5000 })
        if (response.data?.[0]?.phonetics) {
            for (const p of response.data[0].phonetics) {
                if (!p.audio) continue
                if (p.audio.includes('-us.mp3') || p.audio.includes('/us/')) result.usAudioUrl = p.audio
                else if (p.audio.includes('-uk.mp3') || p.audio.includes('/uk/')) result.ukAudioUrl = p.audio
                else if (!result.usAudioUrl) result.usAudioUrl = p.audio
            }
        }
    } catch (e) { /* ignore */ }

    // 2. 尝试 有道词典
    if (!result.usAudioUrl) result.usAudioUrl = `http://dict.youdao.com/dictvoice?type=0&audio=${word}`
    if (!result.ukAudioUrl) result.ukAudioUrl = `http://dict.youdao.com/dictvoice?type=1&audio=${word}`

    // 3. 尝试 Google TTS
    if (!result.usAudioUrl) result.usAudioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${word}&tl=en`

    return result
}

/**
 * 下载音频文件
 */
async function downloadAudio(url, filepath, retries = 0) {
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

        console.error(`  ✗ 下载失败:`, error.message)
        return false
    }
}

/**
 * 保存音频到数据库
 */
async function saveAudioToDatabase(vocabularyId, audioUrl, accent) {
    // 先检查是否已存在，防止重复插入
    const existing = await prisma.word_audios.findFirst({
        where: {
            vocabularyId,
            accent
        }
    })

    if (existing) {
        await prisma.word_audios.update({
            where: { id: existing.id },
            data: { audioUrl }
        })
    } else {
        await prisma.word_audios.create({
            data: {
                id: generateId('audio'),
                vocabularyId,
                audioUrl,
                accent,
            },
        })
    }
}

/**
 * 处理单个单词
 */
async function processWord(word, vocabularyId, needUS, needUK, stats) {
    console.log(`\n处理单词: ${word}`)
    console.log(`  需要: ${needUS ? '美式' : ''}${needUS && needUK ? ' + ' : ''}${needUK ? '英式' : ''}`)

    const usFilename = `${word}-us.mp3`
    const usFilepath = path.join(CONFIG.AUDIO_DIR, usFilename)
    const usAudioUrl = `/uploads/word-audios/${usFilename}`

    const ukFilename = `${word}-uk.mp3`
    const ukFilepath = path.join(CONFIG.AUDIO_DIR, ukFilename)
    const ukAudioUrl = `/uploads/word-audios/${ukFilename}`

    // 1. 先检查本地是否存在
    const usExists = needUS ? await fs.pathExists(usFilepath) : false
    const ukExists = needUK ? await fs.pathExists(ukFilepath) : false

    let audioInfo = null
    let apiCalled = false

    // 2. 如果缺少任何一个需要的音频，才请求 API
    if ((needUS && !usExists) || (needUK && !ukExists)) {
        console.log(`  🔍 本地缺失或需更新，请求 API 获取链接...`)
        audioInfo = await fetchAudioWithFallback(word)
        apiCalled = true
    }

    let usSuccess = false
    let ukSuccess = false

    // 下载美式发音
    if (needUS) {
        if (usExists) {
            console.log(`  ✓ 美式: 本地已有 (跳过下载)`)
            // 确保数据库记录正确
            await saveAudioToDatabase(vocabularyId, usAudioUrl, 'US')
            usSuccess = true
        } else if (audioInfo && audioInfo.usAudioUrl) {
            console.log(`  ⬇ 美式: 下载中...`)
            if (await downloadAudio(audioInfo.usAudioUrl, usFilepath)) {
                await saveAudioToDatabase(vocabularyId, usAudioUrl, 'US')
                stats.usDownloaded++
                usSuccess = true
            }
        } else {
            console.log(`  ⚠ 美式: 未找到资源`)
        }
    }

    // 下载英式发音
    if (needUK) {
        if (ukExists) {
            console.log(`  ✓ 英式: 本地已有 (跳过下载)`)
            await saveAudioToDatabase(vocabularyId, ukAudioUrl, 'UK')
            ukSuccess = true
        } else if (audioInfo && audioInfo.ukAudioUrl) {
            console.log(`  ⬇ 英式: 下载中...`)
            if (await downloadAudio(audioInfo.ukAudioUrl, ukFilepath)) {
                await saveAudioToDatabase(vocabularyId, ukAudioUrl, 'UK')
                stats.ukDownloaded++
                ukSuccess = true
            }
        } else {
            console.log(`  ⚠ 英式: 未找到资源`)
        }
    }

    // 更新统计
    if ((needUS && usSuccess) || (needUK && ukSuccess)) {
        stats.success++
    } else if (!usSuccess && !ukSuccess) {
        stats.failed++
    }

    if (apiCalled) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY))
    }
}

/**
 * 简单的并发控制器
 */
const createLimit = (concurrency) => {
    let active = 0;
    const queue = [];

    const next = () => {
        active--;
        if (queue.length > 0) {
            const [fn, resolve, reject] = queue.shift();
            active++;
            fn().then(resolve).catch(reject).finally(next);
        }
    }

    return (fn) => {
        return new Promise((resolve, reject) => {
            const run = () => {
                active++;
                fn().then(resolve).catch(reject).finally(next);
            };

            if (active < concurrency) {
                run();
            } else {
                queue.push([fn, resolve, reject]);
            }
        });
    };
};

async function main() {
    try {
        console.log('=========================================')
        console.log('  词汇音频下载工具 (JS修复版)')
        console.log('=========================================\n')

        await fs.ensureDir(CONFIG.AUDIO_DIR)
        console.log(`✓ 音频目录: ${CONFIG.AUDIO_DIR}\n`)

        console.log('正在查询需要音频的词汇...')
        const vocabularies = await prisma.vocabularies.findMany({
            include: {
                word_audios: true,
            },
            orderBy: {
                word: 'asc',
            },
        })

        const wordsToProcess = []

        for (const vocab of vocabularies) {
            const usAudio = vocab.word_audios.find(a => a.accent === 'US')
            const ukAudio = vocab.word_audios.find(a => a.accent === 'UK')

            let needUS = true
            let needUK = true

            // 检查数据库记录
            if (usAudio && usAudio.audioUrl) {
                if (usAudio.audioUrl.startsWith('/uploads/')) {
                    const localPath = path.join(process.cwd(), 'public', usAudio.audioUrl.replace(/^\//, ''))
                    if (await fs.pathExists(localPath)) {
                        needUS = false // 数据库有记录且文件存在，无需处理
                    }
                }
            }

            if (ukAudio && ukAudio.audioUrl) {
                if (ukAudio.audioUrl.startsWith('/uploads/')) {
                    const localPath = path.join(process.cwd(), 'public', ukAudio.audioUrl.replace(/^\//, ''))
                    if (await fs.pathExists(localPath)) {
                        needUK = false
                    }
                }
            }

            if (needUS || needUK) {
                wordsToProcess.push({
                    word: vocab.word,
                    vocabularyId: vocab.id,
                    needUS,
                    needUK,
                })
            }
        }

        console.log(`✓ 找到 ${wordsToProcess.length} 个需要处理的词汇 (缺失文件或无记录)\n`)

        const stats = {
            total: wordsToProcess.length,
            success: 0,
            failed: 0,
            usDownloaded: 0,
            ukDownloaded: 0,
        }

        const limit = createLimit(CONFIG.CONCURRENT_DOWNLOADS)

        console.log('开始下载音频...\n')

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

        console.log('\n=========================================')
        console.log('✓ 下载完成!')
        console.log(`总计处理: ${stats.total}`)
        console.log(`成功: ${stats.success}`)
        console.log(`失败: ${stats.failed}`)
        console.log('=========================================\n')

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
