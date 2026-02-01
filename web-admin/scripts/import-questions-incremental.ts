/**
 * @file import-questions-incremental.ts
 * @desc 增量导入练习题 - 只补充缺失的题目，不清空现有数据
 */

import { PrismaClient, QuestionType } from '@prisma/client'
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
    meaning: string
    questions: ParsedQuestion[]
}

interface ExistingQuestionsMap {
    [vocabularyId: string]: {
        ENGLISH_TO_CHINESE?: boolean
        CHINESE_TO_ENGLISH?: boolean
        LISTENING?: boolean
        FILL_IN_BLANK?: boolean
    }
}

async function importIncrementalQuestions() {
    console.log('=========================================')
    console.log('  增量导入练习题数据 (不清空现有数据)')
    console.log('=========================================\n')

    // 读取解析后的数据
    const dataPath = path.join(process.cwd(), 'scripts', 'parsed-questions-v4.json')
    if (!fs.existsSync(dataPath)) {
        console.error('错误: 未找到 parsed-questions-v4.json，请先运行 parse-questions-v4.ts')
        return
    }
    const parsedData: ParsedWordQuestions[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    console.log(`读取到 ${parsedData.length} 个单词的题目数据\n`)

    // 获取所有词汇
    const vocabularies = await prisma.vocabularies.findMany({
        select: {
            id: true,
            word: true,
            primary_meaning: true,
            secondary_meaning: true,
            word_audios: {
                select: { audioUrl: true, accent: true }
            }
        }
    })
    const vocabMap = new Map(vocabularies.map(v => [v.word.toLowerCase(), v]))
    console.log(`数据库中有 ${vocabularies.length} 个词汇\n`)

    // 获取现有题目映射
    console.log('分析现有题目...')
    const existingQuestions = await prisma.questions.findMany({
        select: {
            vocabularyId: true,
            type: true
        }
    })

    const existingMap: ExistingQuestionsMap = {}
    for (const q of existingQuestions) {
        if (!existingMap[q.vocabularyId]) {
            existingMap[q.vocabularyId] = {}
        }
        existingMap[q.vocabularyId][q.type as QuestionType] = true
    }

    // 统计现有题目
    const stats = {
        wordsWithAll: 0,
        wordsWithPartial: 0,
        wordsWithNone: 0,
        missingByType: {
            ENGLISH_TO_CHINESE: 0,
            CHINESE_TO_ENGLISH: 0,
            LISTENING: 0,
            FILL_IN_BLANK: 0
        }
    }

    for (const v of vocabularies) {
        const has = existingMap[v.id] || {}
        const typeCount = Object.keys(has).length
        if (typeCount === 4) {
            stats.wordsWithAll++
        } else if (typeCount === 0) {
            stats.wordsWithNone++
        } else {
            stats.wordsWithPartial++
            if (!has.ENGLISH_TO_CHINESE) stats.missingByType.ENGLISH_TO_CHINESE++
            if (!has.CHINESE_TO_ENGLISH) stats.missingByType.CHINESE_TO_ENGLISH++
            if (!has.LISTENING) stats.missingByType.LISTENING++
            if (!has.FILL_IN_BLANK) stats.missingByType.FILL_IN_BLANK++
        }
    }

    console.log('现有题目统计:')
    console.log(`  - 完整(4题): ${stats.wordsWithAll}`)
    console.log(`  - 部分: ${stats.wordsWithPartial}`)
    console.log(`  - 无题目: ${stats.wordsWithNone}`)
    console.log(`缺失题型统计:`)
    console.log(`  - ENGLISH_TO_CHINESE: ${stats.missingByType.ENGLISH_TO_CHINESE}`)
    console.log(`  - CHINESE_TO_ENGLISH: ${stats.missingByType.CHINESE_TO_ENGLISH}`)
    console.log(`  - LISTENING: ${stats.missingByType.LISTENING}`)
    console.log(`  - FILL_IN_BLANK: ${stats.missingByType.FILL_IN_BLANK}`)
    console.log('')

    // 增量导入
    let matchedWords = 0
    let unmatchedWords: string[] = []
    let addedQuestions = 0
    let addedOptions = 0
    let addedListening = 0
    let skippedExisting = 0

    console.log('开始增量导入...\n')

    for (const wordData of parsedData) {
        const vocabInfo = vocabMap.get(wordData.word.toLowerCase())

        if (!vocabInfo) {
            unmatchedWords.push(wordData.word)
            continue
        }

        matchedWords++
        const vocabId = vocabInfo.id
        const existing = existingMap[vocabId] || {}

        // 导入文档中缺失的题目
        for (const q of wordData.questions) {
            // 如果该类型题目已存在，跳过
            if (existing[q.type]) {
                skippedExisting++
                continue
            }

            let finalCorrectAnswer = q.correctAnswer
            const finalOptions = q.options.map(o => ({ ...o }))

            // 处理 UNKNOWN 答案
            if (finalCorrectAnswer === 'UNKNOWN') {
                const dbMeanings = [vocabInfo.primary_meaning, vocabInfo.secondary_meaning]
                    .filter(m => m)
                    .join('；')
                    .split(/[；;,，\s]+/)
                    .filter(m => m && m.length > 0)

                for (const opt of finalOptions) {
                    const isMatch = dbMeanings.some(m => opt.content.includes(m) || m.includes(opt.content))
                    if (isMatch) {
                        finalCorrectAnswer = opt.label
                        opt.isCorrect = true
                        break
                    }
                }
            }

            if (finalCorrectAnswer === 'UNKNOWN') {
                continue
            }

            const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            await prisma.questions.create({
                data: {
                    id: questionId,
                    vocabularyId: vocabId,
                    type: q.type,
                    content: q.content,
                    sentence: q.type === 'FILL_IN_BLANK' ? q.content : null,
                    correctAnswer: finalCorrectAnswer,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })
            addedQuestions++

            // 创建选项
            for (let i = 0; i < finalOptions.length; i++) {
                const opt = finalOptions[i]
                await prisma.question_options.create({
                    data: {
                        id: `qo_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
                        questionId: questionId,
                        content: opt.content,
                        isCorrect: opt.isCorrect,
                        order: i + 1
                    }
                })
                addedOptions++
            }

            // 更新现有题目映射
            existing[q.type as QuestionType] = true
        }

        // 补充听力题（如果缺失且有音频）
        if (!existing.LISTENING && vocabInfo.word_audios && vocabInfo.word_audios.length > 0) {
            const audioUrl = vocabInfo.word_audios[0].audioUrl
            const firstLetter = wordData.word[0].toLowerCase()
            const sameLetterWords = vocabularies
                .filter(v => v.word.toLowerCase().startsWith(firstLetter) && v.word.toLowerCase() !== wordData.word.toLowerCase())
                .map(v => v.word)
                .slice(0, 10)

            if (sameLetterWords.length >= 3) {
                const shuffled = sameLetterWords.sort(() => Math.random() - 0.5).slice(0, 3)
                const allOptions = [wordData.word, ...shuffled].sort(() => Math.random() - 0.5)
                const correctIndex = allOptions.findIndex(o => o.toLowerCase() === wordData.word.toLowerCase())
                const correctLabel = ['A', 'B', 'C', 'D'][correctIndex]

                const listeningQuestionId = `q_${Date.now()}_listen_${Math.random().toString(36).substr(2, 9)}`

                await prisma.questions.create({
                    data: {
                        id: listeningQuestionId,
                        vocabularyId: vocabId,
                        type: 'LISTENING',
                        content: '听音频选择正确的单词',
                        audioUrl: audioUrl,
                        correctAnswer: correctLabel,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                })
                addedQuestions++
                addedListening++

                // 创建听力题选项
                for (let i = 0; i < allOptions.length; i++) {
                    await prisma.question_options.create({
                        data: {
                            id: `qo_${Date.now()}_listen_${i}_${Math.random().toString(36).substr(2, 9)}`,
                            questionId: listeningQuestionId,
                            content: allOptions[i],
                            isCorrect: i === correctIndex,
                            order: i + 1
                        }
                    })
                    addedOptions++
                }

                existing.LISTENING = true
            }
        }

        // 进度显示
        if (matchedWords % 100 === 0) {
            console.log(`进度: ${matchedWords}/${parsedData.length}, 新增题目: ${addedQuestions}`)
        }
    }

    console.log('\n=========================================')
    console.log('  导入完成!')
    console.log('=========================================')
    console.log(`处理的单词: ${matchedWords}`)
    console.log(`未匹配的单词: ${unmatchedWords.length}`)
    console.log(`新增题目: ${addedQuestions}`)
    console.log(`  - 文档题目: ${addedQuestions - addedListening}`)
    console.log(`  - 听力题: ${addedListening}`)
    console.log(`新增选项: ${addedOptions}`)
    console.log(`跳过已存在: ${skippedExisting}`)

    if (unmatchedWords.length > 0 && unmatchedWords.length <= 20) {
        console.log('\n未匹配的单词列表:')
        unmatchedWords.forEach(w => console.log(`  - ${w}`))
    }

    await prisma.$disconnect()
}

if (require.main === module) {
    importIncrementalQuestions()
}

export { importIncrementalQuestions }
