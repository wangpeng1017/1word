/**
 * 检查词汇音频数据完整性
 * 统计有音频和无音频的单词数量
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface AudioStats {
    totalWords: number
    wordsWithAudio: number
    wordsWithoutAudio: number
    wordsWithUSAudio: number
    wordsWithUKAudio: number
    wordsWithBothAccents: number
    wordsWithOnlyUS: number
    wordsWithOnlyUK: number
}

async function checkAudioStatus() {
    try {
        console.log('=========================================')
        console.log('  词汇音频数据完整性检查')
        console.log('=========================================\n')

        // 获取所有词汇及其音频
        console.log('正在查询数据库...')
        const vocabularies = await prisma.vocabularies.findMany({
            include: {
                word_audios: true
            },
            orderBy: {
                word: 'asc'
            }
        })

        console.log(`✓ 查询完成，共 ${vocabularies.length} 个词汇\n`)

        // 统计数据
        const stats: AudioStats = {
            totalWords: vocabularies.length,
            wordsWithAudio: 0,
            wordsWithoutAudio: 0,
            wordsWithUSAudio: 0,
            wordsWithUKAudio: 0,
            wordsWithBothAccents: 0,
            wordsWithOnlyUS: 0,
            wordsWithOnlyUK: 0
        }

        const wordsWithoutAudio: string[] = []
        const wordsWithoutUS: string[] = []
        const wordsWithoutUK: string[] = []

        // 分析每个词汇
        for (const vocab of vocabularies) {
            const audios = vocab.word_audios
            const hasUS = audios.some(a => a.accent === 'US')
            const hasUK = audios.some(a => a.accent === 'UK')

            if (audios.length === 0) {
                stats.wordsWithoutAudio++
                wordsWithoutAudio.push(vocab.word)
            } else {
                stats.wordsWithAudio++
            }

            if (hasUS) stats.wordsWithUSAudio++
            if (hasUK) stats.wordsWithUKAudio++

            if (hasUS && hasUK) {
                stats.wordsWithBothAccents++
            } else if (hasUS) {
                stats.wordsWithOnlyUS++
                wordsWithoutUK.push(vocab.word)
            } else if (hasUK) {
                stats.wordsWithOnlyUK++
                wordsWithoutUS.push(vocab.word)
            }

            if (!hasUS) wordsWithoutUS.push(vocab.word)
            if (!hasUK) wordsWithoutUK.push(vocab.word)
        }

        // 输出统计结果
        console.log('=========================================')
        console.log('  统计结果')
        console.log('=========================================')
        console.log(`总词汇数:           ${stats.totalWords}`)
        console.log(`有音频的词汇:       ${stats.wordsWithAudio} (${(stats.wordsWithAudio / stats.totalWords * 100).toFixed(2)}%)`)
        console.log(`无音频的词汇:       ${stats.wordsWithoutAudio} (${(stats.wordsWithoutAudio / stats.totalWords * 100).toFixed(2)}%)`)
        console.log('')
        console.log('--- 按口音统计 ---')
        console.log(`有美式发音:         ${stats.wordsWithUSAudio} (${(stats.wordsWithUSAudio / stats.totalWords * 100).toFixed(2)}%)`)
        console.log(`有英式发音:         ${stats.wordsWithUKAudio} (${(stats.wordsWithUKAudio / stats.totalWords * 100).toFixed(2)}%)`)
        console.log(`同时有两种发音:     ${stats.wordsWithBothAccents} (${(stats.wordsWithBothAccents / stats.totalWords * 100).toFixed(2)}%)`)
        console.log(`仅有美式发音:       ${stats.wordsWithOnlyUS}`)
        console.log(`仅有英式发音:       ${stats.wordsWithOnlyUK}`)
        console.log('=========================================\n')

        // 保存缺失音频的单词列表
        const outputDir = path.join(process.cwd(), '..')
        const missingAudioFile = path.join(outputDir, 'missing-audio-words.json')

        const missingData = {
            stats,
            generatedAt: new Date().toISOString(),
            wordsWithoutAnyAudio: wordsWithoutAudio,
            wordsWithoutUSAudio: wordsWithoutUS,
            wordsWithoutUKAudio: wordsWithoutUK
        }

        fs.writeFileSync(missingAudioFile, JSON.stringify(missingData, null, 2), 'utf-8')
        console.log(`✓ 缺失音频单词列表已保存到: ${missingAudioFile}\n`)

        // 显示部分缺失音频的单词
        if (wordsWithoutAudio.length > 0) {
            console.log('完全无音频的单词示例（前20个）:')
            console.log(wordsWithoutAudio.slice(0, 20).join(', '))
            console.log('')
        }

        if (wordsWithoutUS.length > 0 && wordsWithoutUS.length !== wordsWithoutAudio.length) {
            console.log('缺少美式发音的单词示例（前20个）:')
            console.log(wordsWithoutUS.slice(0, 20).join(', '))
            console.log('')
        }

        if (wordsWithoutUK.length > 0 && wordsWithoutUK.length !== wordsWithoutAudio.length) {
            console.log('缺少英式发音的单词示例（前20个）:')
            console.log(wordsWithoutUK.slice(0, 20).join(', '))
            console.log('')
        }

        console.log('=========================================')
        console.log('✓ 检查完成!')
        console.log('=========================================')

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    checkAudioStatus()
}
