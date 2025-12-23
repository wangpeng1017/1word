/**
 * PDF 词汇导入脚本
 * 
 * 由于PDF文件较大(2.27GB)，建议分步骤执行：
 * 1. 先手动提取部分样本数据测试
 * 2. 确认数据格式正确后再批量导入
 * 
 * 使用方法:
 * npx ts-node scripts/import-vocabulary.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// 词汇数据类型定义
interface VocabularyData {
    word: string
    partOfSpeech: string[]
    primaryMeaning: string
    secondaryMeaning?: string
    phonetic?: string
    phoneticUS?: string
    phoneticUK?: string
    isHighFrequency?: boolean
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
    meanings?: MeaningData[]
    images?: ImageData[]
}

interface MeaningData {
    partOfSpeech: string
    meaning: string
    order: number
    examples?: string[]
}

interface ImageData {
    imageUrl: string
    description?: string
}

/**
 * 生成唯一ID
 */
function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 从Google TTS获取音频
 */
async function fetchAudio(word: string, accent: 'US' | 'UK' = 'US'): Promise<string | null> {
    try {
        const tl = accent === 'US' ? 'en-US' : 'en-GB'
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=${tl}&client=tw-ob`

        const response = await fetch(url)
        if (!response.ok) {
            console.error(`获取音频失败: ${word} (${accent})`)
            return null
        }

        const buffer = await response.arrayBuffer()
        const filename = `${word.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${accent.toLowerCase()}.mp3`
        const filepath = path.join(process.cwd(), 'public/uploads/vocabulary-audios', filename)

        // 确保目录存在
        const dir = path.dirname(filepath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(filepath, Buffer.from(buffer))
        console.log(`✓ 音频已保存: ${filename}`)

        return `/uploads/vocabulary-audios/${filename}`
    } catch (error) {
        console.error(`获取音频出错: ${word} (${accent})`, error)
        return null
    }
}

/**
 * 延迟函数（避免请求过快）
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 导入单个词汇到数据库
 */
async function importVocabulary(vocabData: VocabularyData): Promise<void> {
    try {
        console.log(`\n处理词汇: ${vocabData.word}`)

        // 检查是否已存在
        const existing = await prisma.vocabularies.findUnique({
            where: { word: vocabData.word }
        })

        if (existing) {
            console.log(`  ⚠ 词汇已存在，跳过: ${vocabData.word}`)
            return
        }

        // 创建词汇记录
        const vocabulary = await prisma.vocabularies.create({
            data: {
                id: generateId('vocab'),
                word: vocabData.word,
                part_of_speech: vocabData.partOfSpeech,
                primary_meaning: vocabData.primaryMeaning,
                secondary_meaning: vocabData.secondaryMeaning,
                phonetic: vocabData.phonetic,
                phonetic_us: vocabData.phoneticUS,
                phonetic_uk: vocabData.phoneticUK,
                is_high_frequency: vocabData.isHighFrequency || false,
                difficulty: vocabData.difficulty || 'MEDIUM',
                updated_at: new Date(),
            }
        })
        console.log(`  ✓ 词汇创建成功`)

        // 创建释义记录
        if (vocabData.meanings && vocabData.meanings.length > 0) {
            for (const meaning of vocabData.meanings) {
                await prisma.word_meanings.create({
                    data: {
                        id: generateId('meaning'),
                        vocabularyId: vocabulary.id,
                        partOfSpeech: meaning.partOfSpeech,
                        meaning: meaning.meaning,
                        orderIndex: meaning.order,
                        examples: meaning.examples || [],
                    }
                })
            }
            console.log(`  ✓ 创建了 ${vocabData.meanings.length} 条释义`)
        }

        // 创建图片记录
        if (vocabData.images && vocabData.images.length > 0) {
            for (const image of vocabData.images) {
                await prisma.word_images.create({
                    data: {
                        id: generateId('image'),
                        vocabularyId: vocabulary.id,
                        imageUrl: image.imageUrl,
                        description: image.description,
                    }
                })
            }
            console.log(`  ✓ 创建了 ${vocabData.images.length} 张图片`)
        }

        // 获取音频
        console.log(`  获取音频中...`)
        const audioUS = await fetchAudio(vocabData.word, 'US')
        await delay(500) // 延迟避免请求太快
        const audioUK = await fetchAudio(vocabData.word, 'UK')
        await delay(500)

        // 创建音频记录
        if (audioUS) {
            await prisma.word_audios.create({
                data: {
                    id: generateId('audio'),
                    vocabularyId: vocabulary.id,
                    audioUrl: audioUS,
                    accent: 'US',
                }
            })
            console.log(`  ✓ 美式音频已创建`)
        }

        if (audioUK) {
            await prisma.word_audios.create({
                data: {
                    id: generateId('audio'),
                    vocabularyId: vocabulary.id,
                    audioUrl: audioUK,
                    accent: 'UK',
                }
            })
            console.log(`  ✓ 英式音频已创建`)
        }

        console.log(`✓ 词汇导入完成: ${vocabData.word}`)
    } catch (error) {
        console.error(`✗ 导入失败: ${vocabData.word}`, error)
        throw error
    }
}

/**
 * 批量导入词汇
 */
async function importVocabularies(vocabularies: VocabularyData[]): Promise<void> {
    console.log(`\n开始导入 ${vocabularies.length} 个词汇...`)
    console.log(`==========================================\n`)

    let successCount = 0
    let failCount = 0

    for (const vocab of vocabularies) {
        try {
            await importVocabulary(vocab)
            successCount++
        } catch (error) {
            failCount++
            console.error(`导入失败，继续下一个...`)
        }
    }

    console.log(`\n==========================================`)
    console.log(`导入完成!`)
    console.log(`  成功: ${successCount}`)
    console.log(`  失败: ${failCount}`)
    console.log(`  总计: ${vocabularies.length}`)
}

/**
 * 创建R开头的词汇库
 */
async function createRVocabularyPack(): Promise<void> {
    console.log(`\n创建R开头词汇库...`)

    // 查询所有R开头的单词
    const rWords = await prisma.vocabularies.findMany({
        where: {
            word: {
                startsWith: 'r',
                mode: 'insensitive' // 不区分大小写
            }
        },
        orderBy: {
            word: 'asc'
        }
    })

    if (rWords.length === 0) {
        console.log(`  ⚠ 没有找到R开头的单词`)
        return
    }

    console.log(`  找到 ${rWords.length} 个R开头的单词`)

    // 检查是否已存在
    const existing = await prisma.vocabulary_packs.findUnique({
        where: { name: 'R开头单词词汇库' }
    })

    if (existing) {
        console.log(`  ⚠ 词汇库已存在，删除旧数据...`)
        await prisma.vocabulary_packs.delete({
            where: { id: existing.id }
        })
    }

    // 获取当前用户ID（这里需要根据实际情况调整）
    const currentUser = await prisma.user.findFirst({
        where: { role: { in: ['TEACHER', 'ADMIN'] } }
    })

    if (!currentUser) {
        throw new Error('找不到管理员用户')
    }

    // 创建词汇库
    const wordsPerDay = 20
    const totalDays = Math.ceil(rWords.length / wordsPerDay)

    const pack = await prisma.vocabulary_packs.create({
        data: {
            id: generateId('pack'),
            name: 'R开头单词词汇库',
            description: `包含所有以R开头的单词，共 ${rWords.length} 个`,
            totalDays: totalDays,
            totalWords: rWords.length,
            isActive: true,
            createdBy: currentUser.id,
            updatedAt: new Date(),
        }
    })
    console.log(`  ✓ 词汇库创建成功`)

    // 创建每日配置
    for (let day = 1; day <= totalDays; day++) {
        const startIdx = (day - 1) * wordsPerDay
        const endIdx = Math.min(day * wordsPerDay, rWords.length)
        const dayWords = rWords.slice(startIdx, endIdx)

        const packDay = await prisma.vocabulary_pack_days.create({
            data: {
                id: generateId('packday'),
                packId: pack.id,
                dayNumber: day,
                title: `Day${day} - R开头单词 (${startIdx + 1}-${endIdx})`,
                wordCount: dayWords.length,
                updatedAt: new Date(),
            }
        })

        // 关联单词
        for (let i = 0; i < dayWords.length; i++) {
            await prisma.vocabulary_pack_day_words.create({
                data: {
                    id: generateId('packdayword'),
                    packDayId: packDay.id,
                    vocabularyId: dayWords[i].id,
                    orderIndex: i,
                }
            })
        }

        console.log(`  ✓ Day${day} 配置完成 (${dayWords.length} 个单词)`)
    }

    console.log(`✓ R开头词汇库创建完成!`)
    console.log(`  名称: ${pack.name}`)
    console.log(`  总天数: ${totalDays}`)
    console.log(`  总单词数: ${rWords.length}`)
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('===========================================')
        console.log('  PDF 词汇导入脚本')
        console.log('===========================================\n')

        // 从JSON文件读取词汇数据
        console.log('步骤 1: 读取词汇数据')
        const jsonPath = path.join(__dirname, 'vocabulary-data-all.json')
        const jsonData = fs.readFileSync(jsonPath, 'utf-8')
        const vocabularies: VocabularyData[] = JSON.parse(jsonData)
        console.log(`  ✓ 成功读取 ${vocabularies.length} 个词汇\n`)

        // 1. 导入词汇
        console.log('步骤 2: 导入词汇数据')
        await importVocabularies(vocabularies)

        // 2. 创建R开头词汇库（暂时跳过，因为我们导入的是B开头的）
        console.log('\n步骤 3: 创建词汇库')
        console.log('  注意: 当前导入的是B开头的单词，R开头词汇库创建已跳过')
        console.log('  如需创建R开头词汇库，请先导入R开头的单词数据')

        console.log('\n✓ 所有任务完成!')

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// 执行主函数
if (require.main === module) {
    main()
}

export { importVocabulary, importVocabularies, createRVocabularyPack }
