/**
 * 清空并重新导入词汇数据
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface SourceVocab {
    word: string
    definition: string
    image: string
    page: number
}

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 从definition中提取词性和释义
 * 修复版本：正确处理"v ."等带空格的词性标记
 */
function parseDefinition(definition: string): {
    partOfSpeech: string[]
    primaryMeaning: string
    meanings: Array<{ partOfSpeech: string; meaning: string; order: number }>
} {
    if (!definition || definition.trim() === '') {
        return {
            partOfSpeech: ['n.'],
            primaryMeaning: '',
            meanings: []
        }
    }

    const parts: string[] = []
    const meanings: Array<{ partOfSpeech: string; meaning: string; order: number }> = []

    // 常见词性标记（包括带空格的）
    const posPatterns = [
        'v .', 'n .', 'adj .', 'adv .', 'prep .', 'conj .', 'pron .', 'int .',
        'vt .', 'vi .', 'n/v .', 'n/adj .', 'abbr .',
        'v.', 'n.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'int.',
        'vt.', 'vi.', 'n/v.', 'n/adj.', 'abbr.'
    ]

    // 先尝试找到第一个词性标记的位置
    let firstPosIndex = -1
    let firstPos = ''

    for (const pos of posPatterns) {
        const index = definition.indexOf(pos)
        if (index !== -1 && (firstPosIndex === -1 || index < firstPosIndex)) {
            firstPosIndex = index
            firstPos = pos
        }
    }

    // 如果找不到词性标记，整个definition作为释义
    if (firstPosIndex === -1) {
        parts.push('n.')
        meanings.push({
            partOfSpeech: 'n.',
            meaning: definition.trim(),
            order: 0
        })
        return {
            partOfSpeech: parts,
            primaryMeaning: definition.substring(0, 200),
            meanings
        }
    }

    // 从第一个词性标记开始解析
    let remaining = definition.substring(firstPosIndex)
    let order = 0

    while (remaining.length > 0) {
        // 找到当前词性
        let currentPos = ''
        let currentPosLength = 0

        for (const pos of posPatterns) {
            if (remaining.startsWith(pos)) {
                currentPos = pos
                currentPosLength = pos.length
                break
            }
        }

        if (!currentPos) {
            break
        }

        // 移除当前词性标记
        remaining = remaining.substring(currentPosLength).trim()

        // 找到下一个词性标记的位置
        let nextPosIndex = -1
        for (const pos of posPatterns) {
            const index = remaining.indexOf(' ' + pos)
            if (index !== -1 && (nextPosIndex === -1 || index < nextPosIndex)) {
                nextPosIndex = index
            }
        }

        // 提取释义
        let meaning = ''
        if (nextPosIndex === -1) {
            // 没有下一个词性了，剩余全部是释义
            meaning = remaining.trim()
            remaining = ''
        } else {
            // 提取到下一个词性之前的内容
            meaning = remaining.substring(0, nextPosIndex).trim()
            remaining = remaining.substring(nextPosIndex).trim()
        }

        // 清理释义末尾的标点
        meaning = meaning.replace(/[，；、]+$/, '').trim()

        if (meaning) {
            if (!parts.includes(currentPos)) {
                parts.push(currentPos)
            }
            meanings.push({
                partOfSpeech: currentPos,
                meaning: meaning,
                order: order++
            })
        }
    }

    // 如果没有解析出任何释义，使用整个definition
    if (meanings.length === 0) {
        parts.push('n.')
        meanings.push({
            partOfSpeech: 'n.',
            meaning: definition.trim(),
            order: 0
        })
    }

    const primaryMeaning = meanings.length > 0
        ? meanings.map(m => m.meaning).join('；').substring(0, 200)
        : definition.substring(0, 200)

    return {
        partOfSpeech: parts,
        primaryMeaning,
        meanings
    }
}

/**
 * 获取音频
 */
async function fetchAudio(word: string, accent: 'US' | 'UK' = 'US'): Promise<string | null> {
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

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 清空现有词汇数据
 */
async function clearExistingData(): Promise<void> {
    console.log('\n清空现有数据...')

    await prisma.word_audios.deleteMany({})
    console.log('  ✓ 已删除所有音频记录')

    await prisma.word_images.deleteMany({})
    console.log('  ✓ 已删除所有图片记录')

    await prisma.word_meanings.deleteMany({})
    console.log('  ✓ 已删除所有释义记录')

    await prisma.vocabularies.deleteMany({})
    console.log('  ✓ 已删除所有词汇记录')

    console.log('✓ 数据清空完成\n')
}

/**
 * 导入单个词汇
 */
async function importVocabulary(sourceVocab: SourceVocab, index: number, total: number): Promise<boolean> {
    try {
        const word = sourceVocab.word?.trim()
        if (!word) {
            return false
        }

        if ((index + 1) % 50 === 0) {
            console.log(`[${index + 1}/${total}] 处理: ${word}`)
        }

        // 解析definition
        const parsed = parseDefinition(sourceVocab.definition)

        // 创建词汇记录
        const vocabulary = await prisma.vocabularies.create({
            data: {
                id: generateId('vocab'),
                word,
                part_of_speech: parsed.partOfSpeech,
                primary_meaning: parsed.primaryMeaning || word,
                updated_at: new Date(),
            }
        })

        // 创建释义记录
        for (const meaning of parsed.meanings) {
            await prisma.word_meanings.create({
                data: {
                    id: generateId('meaning'),
                    vocabularyId: vocabulary.id,
                    partOfSpeech: meaning.partOfSpeech,
                    meaning: meaning.meaning,
                    orderIndex: meaning.order,
                    examples: [],
                }
            })
        }

        // 创建图片记录（如果有图片文件名）
        if (sourceVocab.image && sourceVocab.image.trim() !== '') {
            const imageUrl = `/uploads/vocabulary-images/${sourceVocab.image}`
            await prisma.word_images.create({
                data: {
                    id: generateId('image'),
                    vocabularyId: vocabulary.id,
                    imageUrl: imageUrl,
                    description: `${word}的图片`,
                }
            })
        }

        // 获取音频（每5个词获取一次，避免请求过快）
        if (index % 5 === 0) {
            const audioUS = await fetchAudio(word, 'US')
            if (audioUS) {
                await prisma.word_audios.create({
                    data: {
                        id: generateId('audio'),
                        vocabularyId: vocabulary.id,
                        audioUrl: audioUS,
                        accent: 'US',
                    }
                })
            }
            await delay(200)
        }

        return true

    } catch (error) {
        console.error(`  ✗ 导入失败: ${sourceVocab.word}`, error instanceof Error ? error.message : error)
        return false
    }
}

async function main() {
    try {
        console.log('===========================================')
        console.log('  2000词汇完整数据导入')
        console.log('===========================================\n')

        // 清空现有数据
        await clearExistingData()

        // 读取JSON文件
        const jsonPath = 'E:\\trae\\1word\\2000词完整数据_final.json'
        console.log(`读取文件: ${jsonPath}`)

        const jsonData = fs.readFileSync(jsonPath, 'utf-8')
        const sourceVocabs: SourceVocab[] = JSON.parse(jsonData)

        console.log(`✓ 成功读取 ${sourceVocabs.length} 个词汇\n`)
        console.log('开始导入...\n')

        let successCount = 0
        let failCount = 0

        // 批量导入
        for (let i = 0; i < sourceVocabs.length; i++) {
            const result = await importVocabulary(sourceVocabs[i], i, sourceVocabs.length)

            if (result) {
                successCount++
            } else {
                failCount++
            }

            // 每100个词显示一次进度
            if ((i + 1) % 100 === 0) {
                console.log(`\n进度: ${i + 1}/${sourceVocabs.length} (成功:${successCount}, 失败:${failCount})\n`)
            }

            // 延迟避免数据库压力
            if (i % 20 === 0) {
                await delay(50)
            }
        }

        console.log('\n===========================================')
        console.log('✓ 导入完成!')
        console.log(`  总计: ${sourceVocabs.length}`)
        console.log(`  成功: ${successCount}`)
        console.log(`  失败: ${failCount}`)
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
