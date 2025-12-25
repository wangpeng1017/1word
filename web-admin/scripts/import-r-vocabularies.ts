/**
 * 导入 R 开头的词汇数据（追加模式）
 * 从 2000词完整数据_final.json 中筛选 R 开头单词导入
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
            // 标准化词性（移除空格）
            const normalizedPos = currentPos.replace(' ', '')
            if (!parts.includes(normalizedPos)) {
                parts.push(normalizedPos)
            }
            meanings.push({
                partOfSpeech: normalizedPos,
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

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 导入单个词汇
 */
async function importVocabulary(sourceVocab: SourceVocab, index: number, total: number): Promise<{ success: boolean; skipped: boolean }> {
    try {
        const word = sourceVocab.word?.trim()
        if (!word) {
            return { success: false, skipped: false }
        }

        // 检查是否已存在
        const existing = await prisma.vocabularies.findFirst({
            where: { word: word }
        })

        if (existing) {
            if ((index + 1) % 20 === 0) {
                console.log(`[${index + 1}/${total}] ${word}: 已存在，跳过`)
            }
            return { success: true, skipped: true }
        }

        console.log(`[${index + 1}/${total}] 导入: ${word}`)

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
            // 检查图片文件是否存在
            const imagePath = path.join('E:\\trae\\1word\\word_images_final', sourceVocab.image)
            if (fs.existsSync(imagePath)) {
                // 暂时使用本地路径，稍后上传到 Blob
                const imageUrl = `/uploads/vocabulary-images/${sourceVocab.image}`
                await prisma.word_images.create({
                    data: {
                        id: generateId('image'),
                        vocabularyId: vocabulary.id,
                        imageUrl: imageUrl,
                        description: `${word}的图片`,
                    }
                })
            } else {
                console.log(`  ⚠ 图片文件不存在: ${sourceVocab.image}`)
            }
        }

        return { success: true, skipped: false }

    } catch (error) {
        console.error(`  ✗ 导入失败: ${sourceVocab.word}`, error instanceof Error ? error.message : error)
        return { success: false, skipped: false }
    }
}

async function main() {
    try {
        console.log('===========================================')
        console.log('  导入 R 开头词汇数据 (追加模式)')
        console.log('===========================================\n')

        // 读取JSON文件
        const jsonPath = 'E:\\trae\\1word\\2000词完整数据_final.json'
        console.log(`读取文件: ${jsonPath}`)

        const jsonData = fs.readFileSync(jsonPath, 'utf-8')
        const allVocabs: SourceVocab[] = JSON.parse(jsonData)

        // 筛选 R 开头的单词
        const rVocabs = allVocabs.filter(v => v.word && v.word.toLowerCase().startsWith('r'))

        console.log(`✓ 总词汇数: ${allVocabs.length}`)
        console.log(`✓ R 开头词汇: ${rVocabs.length}\n`)
        console.log('开始导入...\n')

        let successCount = 0
        let failCount = 0
        let skippedCount = 0

        // 批量导入
        for (let i = 0; i < rVocabs.length; i++) {
            const result = await importVocabulary(rVocabs[i], i, rVocabs.length)

            if (result.success) {
                if (result.skipped) {
                    skippedCount++
                } else {
                    successCount++
                }
            } else {
                failCount++
            }

            // 延迟避免数据库压力
            if (i % 10 === 0) {
                await delay(50)
            }
        }

        console.log('\n===========================================')
        console.log('✓ 导入完成!')
        console.log(`  总计: ${rVocabs.length}`)
        console.log(`  新增: ${successCount}`)
        console.log(`  跳过: ${skippedCount}`)
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
