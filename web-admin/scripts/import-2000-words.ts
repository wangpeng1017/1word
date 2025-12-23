/**
 * 从2000词基础信息.json导入词汇
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface SourceVocab {
    word: string
    definition: string
}

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 从definition中提取词性和释义
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

    // 常见词性标记
    const posPatterns = ['v .', 'n.', 'n .', 'adj .', 'adj.', 'adv .', 'adv.', 'prep .', 'prep.', 'conj .', 'pron .', 'int.', 'vt .', 'vi .', 'vt.', 'vi.', 'abbr.']

    let currentPos = ''
    let currentMeaning = ''
    let order = 0

    // 按空格和常见分隔符分割
    const segments = definition.split(/\s+/)

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]

        // 检查是否是词性标记
        if (posPatterns.includes(segment)) {
            // 保存前一个词性的释义
            if (currentPos && currentMeaning) {
                if (!parts.includes(currentPos)) {
                    parts.push(currentPos)
                }
                meanings.push({
                    partOfSpeech: currentPos,
                    meaning: currentMeaning.trim(),
                    order: order++
                })
            }

            currentPos = segment
            currentMeaning = ''
        } else {
            currentMeaning += (currentMeaning ? ' ' : '') + segment
        }
    }

    // 保存最后一个
    if (currentPos && currentMeaning) {
        if (!parts.includes(currentPos)) {
            parts.push(currentPos)
        }
        meanings.push({
            partOfSpeech: currentPos,
            meaning: currentMeaning.trim(),
            order: order++
        })
    }

    // 如果没有解析出词性，使用整个definition作为主要释义
    if (parts.length === 0) {
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
 * 导入单个词汇
 */
async function importVocabulary(sourceVocab: SourceVocab, index: number, total: number): Promise<boolean> {
    try {
        const word = sourceVocab.word?.trim()
        if (!word) {
            return false
        }

        console.log(`[${index + 1}/${total}] 处理: ${word}`)

        // 检查是否已存在
        const existing = await prisma.vocabularies.findUnique({
            where: { word }
        })

        if (existing) {
            console.log(`  ⚠ 已存在，跳过`)
            return true
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

        // 获取音频（限制并发）
        if (index % 3 === 0) { // 每3个词获取一次音频，避免请求过快
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
            await delay(300)
        }

        console.log(`  ✓ 导入成功`)
        return true

    } catch (error) {
        console.error(`  ✗ 导入失败:`, error instanceof Error ? error.message : error)
        return false
    }
}

async function main() {
    try {
        console.log('===========================================')
        console.log('  2000词汇批量导入')
        console.log('===========================================\n')

        // 读取JSON文件
        const jsonPath = 'E:\\trae\\1word\\2000词基础信息.json'
        console.log(`读取文件: ${jsonPath}`)

        const jsonData = fs.readFileSync(jsonPath, 'utf-8')
        const sourceVocabs: SourceVocab[] = JSON.parse(jsonData)

        console.log(`✓ 成功读取 ${sourceVocabs.length} 个词汇\n`)
        console.log('开始导入...\n')

        let successCount = 0
        let skipCount = 0
        let failCount = 0

        // 批量导入
        for (let i = 0; i < sourceVocabs.length; i++) {
            const result = await importVocabulary(sourceVocabs[i], i, sourceVocabs.length)

            if (result) {
                const existing = await prisma.vocabularies.findUnique({
                    where: { word: sourceVocabs[i].word }
                })
                if (existing && existing.created_at < new Date(Date.now() - 1000)) {
                    skipCount++
                } else {
                    successCount++
                }
            } else {
                failCount++
            }

            // 每100个词显示一次进度
            if ((i + 1) % 100 === 0) {
                console.log(`\n进度: ${i + 1}/${sourceVocabs.length} (成功:${successCount}, 跳过:${skipCount}, 失败:${failCount})\n`)
            }

            // 延迟避免数据库压力
            if (i % 10 === 0) {
                await delay(100)
            }
        }

        console.log('\n===========================================')
        console.log('✓ 导入完成!')
        console.log(`  总计: ${sourceVocabs.length}`)
        console.log(`  成功: ${successCount}`)
        console.log(`  跳过: ${skipCount}`)
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
