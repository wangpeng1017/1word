import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ParsedQuestion {
    word: string
    type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    content: string
    meaning: string
    options: {
        label: string
        content: string
        isCorrect: boolean
    }[]
    correctAnswer: string
}

interface ParsedWordQuestions {
    word: string
    questions: ParsedQuestion[]
}

async function importQuestions() {
    console.log('=========================================')
    console.log('  导入练习题数据')
    console.log('=========================================\n')

    // 读取解析后的数据
    const dataPath = path.join(process.cwd(), 'scripts', 'parsed-questions.json')
    const parsedData: ParsedWordQuestions[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

    console.log(`读取到 ${parsedData.length} 个单词的题目数据\n`)

    // 获取所有词汇的映射
    const vocabularies = await prisma.vocabularies.findMany({
        select: { id: true, word: true }
    })
    const vocabMap = new Map(vocabularies.map(v => [v.word.toLowerCase(), v.id]))

    console.log(`数据库中有 ${vocabularies.length} 个词汇\n`)

    // 清空现有题目数据
    console.log('清空现有题目数据...')
    await prisma.question_options.deleteMany({})
    await prisma.questions.deleteMany({})
    console.log('✓ 已清空\n')

    // 统计
    let matchedWords = 0
    let unmatchedWords: string[] = []
    let importedQuestions = 0
    let importedOptions = 0

    // 批量导入
    for (const wordData of parsedData) {
        const vocabId = vocabMap.get(wordData.word.toLowerCase())

        if (!vocabId) {
            unmatchedWords.push(wordData.word)
            continue
        }

        matchedWords++

        for (const q of wordData.questions) {
            const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // 创建题目
            await prisma.questions.create({
                data: {
                    id: questionId,
                    vocabularyId: vocabId,
                    type: q.type,
                    content: q.content,
                    correctAnswer: q.correctAnswer,
                    createdAt: new Date()
                }
            })
            importedQuestions++

            // 创建选项
            for (let i = 0; i < q.options.length; i++) {
                const opt = q.options[i]
                await prisma.question_options.create({
                    data: {
                        id: `qo_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
                        questionId: questionId,
                        content: opt.content,
                        isCorrect: opt.isCorrect,
                        order: i + 1
                    }
                })
                importedOptions++
            }
        }

        // 进度显示
        if (matchedWords % 100 === 0) {
            console.log(`进度: ${matchedWords}/${parsedData.length}`)
        }
    }

    console.log('\n=========================================')
    console.log('  导入完成!')
    console.log('=========================================')
    console.log(`匹配的单词: ${matchedWords}`)
    console.log(`未匹配的单词: ${unmatchedWords.length}`)
    console.log(`导入的题目: ${importedQuestions}`)
    console.log(`导入的选项: ${importedOptions}`)

    if (unmatchedWords.length > 0 && unmatchedWords.length <= 20) {
        console.log('\n未匹配的单词列表:')
        unmatchedWords.forEach(w => console.log(`  - ${w}`))
    } else if (unmatchedWords.length > 20) {
        console.log(`\n未匹配的单词太多，只显示前20个:`)
        unmatchedWords.slice(0, 20).forEach(w => console.log(`  - ${w}`))
    }

    await prisma.$disconnect()
}

if (require.main === module) {
    importQuestions()
}

export { importQuestions }
