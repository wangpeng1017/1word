/**
 * @file compare-answers.ts
 * @desc 对比原始Word文档中的正确答案与数据库中的答案，找出所有不一致的地方
 * 
 * 策略：
 * 1. 重新解析所有 Word 文档，用严格逻辑确定正确答案
 * 2. 查询数据库中对应题目的正确答案
 * 3. 逐题对比，输出所有不一致项
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

const prisma = new PrismaClient()

interface WordQuestion {
    word: string
    meaning: string // 从①题提取的释义
    questionType: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    content: string  // 题目内容
    options: { label: string; content: string }[]
    correctAnswer: string  // 从Word文档推断的正确答案标签(A/B/C/D)
    correctContent: string // 正确答案的内容
}

/**
 * 解析 Word 文档，严格确定每道题的正确答案
 */
async function parseWordDocument(filePath: string): Promise<WordQuestion[]> {
    const result = await mammoth.extractRawText({ path: filePath })
    const lines = result.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)

    const questions: WordQuestion[] = []
    let currentWord = ''
    let currentMeaning = ''
    let currentQuestionType = 0 // 1=中选英, 2=英选中, 3=填空
    let currentOptions: { label: string; content: string }[] = []
    let currentContent = ''

    function saveCurrentQuestion() {
        if (!currentWord || currentQuestionType === 0 || currentOptions.length < 3) return

        let type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
        let correctAnswer = ''
        let correctContent = ''

        if (currentQuestionType === 1) {
            // ① 中选英: 正确答案是选项内容完全等于单词的那个
            type = 'CHINESE_TO_ENGLISH'
            const match = currentOptions.find(o => o.content.toLowerCase() === currentWord.toLowerCase())
            if (match) {
                correctAnswer = match.label
                correctContent = match.content
            }
        } else if (currentQuestionType === 2) {
            // ② 英选中: 正确答案是选项内容匹配释义的那个
            // 使用严格匹配：先精确匹配，再尝试分词匹配
            type = 'ENGLISH_TO_CHINESE'

            // 先去掉 content 中的音标部分，提取纯单词
            // currentContent 类似 "abandon /əˈbændən/" 

            if (currentMeaning) {
                // 方法1: 精确匹配 - 选项内容完全等于释义
                let match = currentOptions.find(o => o.content === currentMeaning)

                if (!match) {
                    // 方法2: 释义分割后匹配 - 如释义"抛弃；放弃"，选项可能是"放弃"
                    const meaningParts = currentMeaning.split(/[；;,，]/).map(m => m.trim()).filter(m => m.length > 0)

                    // 优先找完全包含所有释义部分的选项
                    match = currentOptions.find(o =>
                        meaningParts.every(m => o.content.includes(m))
                    )

                    if (!match) {
                        // 再找包含任一释义部分的选项（精确匹配，不用includes反向）
                        // 找匹配度最高的选项
                        let bestMatch: { label: string; content: string } | null = null
                        let bestScore = 0

                        for (const opt of currentOptions) {
                            let score = 0
                            for (const m of meaningParts) {
                                if (opt.content === m) score += 10  // 完全匹配单个释义
                                else if (opt.content.includes(m)) score += 5  // 包含释义
                                else if (m.includes(opt.content)) score += 3  // 被释义包含
                            }
                            if (score > bestScore) {
                                bestScore = score
                                bestMatch = opt
                            }
                        }
                        if (bestMatch && bestScore > 0) match = bestMatch
                    }
                }

                if (match) {
                    correctAnswer = match.label
                    correctContent = match.content
                }
            }
        } else {
            // ③ 填空: 正确答案是选项内容等于单词（或其变体形式）
            type = 'FILL_IN_BLANK'
            // 严格匹配：先找完全等于单词的选项
            let match = currentOptions.find(o => o.content.toLowerCase() === currentWord.toLowerCase())

            if (!match) {
                // 再找以单词开头的选项（如复数/过去式）
                // 但要排除完全不同的单词
                const candidates = currentOptions.filter(o =>
                    o.content.toLowerCase().startsWith(currentWord.toLowerCase())
                )
                if (candidates.length === 1) {
                    match = candidates[0]
                } else if (candidates.length > 1) {
                    // 多个候选：选最短的（最接近原形）
                    match = candidates.sort((a, b) => a.content.length - b.content.length)[0]
                }
            }

            if (match) {
                correctAnswer = match.label
                correctContent = match.content
            }
        }

        if (correctAnswer) {
            questions.push({
                word: currentWord,
                meaning: currentMeaning,
                questionType: type!,
                content: currentContent,
                options: [...currentOptions],
                correctAnswer,
                correctContent
            })
        }
    }

    for (const line of lines) {
        // 匹配单词行: "1. abandon" 或 "200. zero"
        const wordMatch = line.match(/^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*)$/)
        if (wordMatch) {
            saveCurrentQuestion()
            currentWord = wordMatch[2].toLowerCase()
            currentMeaning = ''
            currentQuestionType = 0
            currentOptions = []
            continue
        }

        // ① 中选英题
        if (line.startsWith('①') && currentWord) {
            saveCurrentQuestion()
            currentQuestionType = 1
            currentMeaning = line.replace('①', '').trim()
            currentContent = currentMeaning
            currentOptions = []
            continue
        }

        // ② 英选中题
        if (line.startsWith('②') && currentWord) {
            saveCurrentQuestion()
            currentQuestionType = 2
            currentContent = line.replace('②', '').trim()
            currentOptions = []
            continue
        }

        // ③ 填空题
        if (line.startsWith('③') && currentWord) {
            saveCurrentQuestion()
            currentQuestionType = 3
            currentContent = line.replace('③', '').replace(/选词填空[：:]?/, '').trim()
            currentOptions = []
            continue
        }

        // 选项行: "A. abandon"
        const optionMatch = line.match(/^([A-D])[\.\s]+(.+)$/)
        if (optionMatch && currentQuestionType > 0) {
            currentOptions.push({ label: optionMatch[1], content: optionMatch[2].trim() })
            continue
        }
    }
    saveCurrentQuestion()

    return questions
}

async function main() {
    console.log('============================================')
    console.log('  对比 Word 文档 vs 数据库答案')
    console.log('============================================\n')

    // 1. 解析所有 Word 文档
    const docDir = path.resolve(__dirname, '../../练习_extracted/练习')
    const files = fs.readdirSync(docDir).filter(f => f.endsWith('.docx'))
    console.log(`找到 ${files.length} 个 Word 文档\n`)

    let allWordQuestions: WordQuestion[] = []
    for (const file of files) {
        const filePath = path.join(docDir, file)
        console.log(`解析: ${file}...`)
        const questions = await parseWordDocument(filePath)
        console.log(`  -> ${questions.length} 道题`)
        allWordQuestions = allWordQuestions.concat(questions)
    }
    console.log(`\nWord 文档总计: ${allWordQuestions.length} 道题\n`)

    // 2. 查询数据库中的题目
    console.log('查询数据库...\n')
    const dbQuestions = await prisma.questions.findMany({
        where: {
            type: { in: ['CHINESE_TO_ENGLISH', 'ENGLISH_TO_CHINESE', 'FILL_IN_BLANK'] }
        },
        include: {
            vocabularies: { select: { word: true } },
            question_options: { orderBy: { order: 'asc' } }
        }
    })

    // 建立数据库索引: word -> type -> question
    const dbIndex = new Map<string, Map<string, typeof dbQuestions[0]>>()
    for (const q of dbQuestions) {
        const word = q.vocabularies.word.toLowerCase()
        if (!dbIndex.has(word)) dbIndex.set(word, new Map())
        dbIndex.get(word)!.set(q.type, q)
    }

    console.log(`数据库中有 ${dbQuestions.length} 道题\n`)

    // 3. 逐题对比
    let matchCount = 0
    let mismatchCount = 0
    let notFoundCount = 0
    const mismatches: any[] = []

    for (const wq of allWordQuestions) {
        const dbWordQuestions = dbIndex.get(wq.word)
        if (!dbWordQuestions) {
            notFoundCount++
            continue
        }
        const dbQ = dbWordQuestions.get(wq.questionType)
        if (!dbQ) {
            notFoundCount++
            continue
        }

        // 对比正确答案
        const dbCorrectOpt = dbQ.question_options.find(o => o.isCorrect)
        if (!dbCorrectOpt) {
            mismatchCount++
            mismatches.push({
                word: wq.word,
                type: wq.questionType,
                wordDocAnswer: `${wq.correctAnswer}. ${wq.correctContent}`,
                dbAnswer: '无正确答案标记!',
                dbCorrectAnswer: dbQ.correctAnswer,
                options: dbQ.question_options.map(o => `${o.isCorrect ? '✅' : '  '} ${o.content}`).join(' | ')
            })
            continue
        }

        // 对比选项内容是否一致（Word文档 vs 数据库）
        // 先检查正确答案内容是否一致
        const wordCorrectContent = wq.correctContent.toLowerCase().trim()
        const dbCorrectContent = dbCorrectOpt.content.toLowerCase().trim()

        if (wordCorrectContent !== dbCorrectContent) {
            mismatchCount++
            mismatches.push({
                word: wq.word,
                type: wq.questionType,
                wordDocAnswer: `${wq.correctAnswer}. ${wq.correctContent}`,
                dbAnswer: `${dbQ.correctAnswer}. ${dbCorrectOpt.content}`,
                dbCorrectAnswer: dbQ.correctAnswer,
                wordOptions: wq.options.map(o => `${o.label}. ${o.content}`).join(' | '),
                dbOptions: dbQ.question_options.map(o => `${o.isCorrect ? '✅' : '  '} order${o.order}: ${o.content}`).join(' | ')
            })
        } else {
            matchCount++
        }
    }

    // 4. 输出结果
    console.log('============================================')
    console.log('  对比结果')
    console.log('============================================')
    console.log(`✅ 一致: ${matchCount}`)
    console.log(`❌ 不一致: ${mismatchCount}`)
    console.log(`⚠️  未找到: ${notFoundCount}`)
    console.log('')

    if (mismatches.length > 0) {
        console.log('============================================')
        console.log('  不一致列表')
        console.log('============================================\n')
        for (let i = 0; i < mismatches.length; i++) {
            const m = mismatches[i]
            console.log(`${i + 1}. ${m.word} [${m.type}]`)
            console.log(`   Word文档答案: ${m.wordDocAnswer}`)
            console.log(`   数据库答案:   ${m.dbAnswer}`)
            if (m.wordOptions) console.log(`   Word选项: ${m.wordOptions}`)
            if (m.dbOptions) console.log(`   DB选项:   ${m.dbOptions}`)
            console.log('')
        }
    }

    // 5. 输出到文件
    const resultPath = path.join(__dirname, 'compare-results.json')
    fs.writeFileSync(resultPath, JSON.stringify({
        summary: { match: matchCount, mismatch: mismatchCount, notFound: notFoundCount },
        mismatches
    }, null, 2), 'utf8')
    console.log(`\n详细结果已保存到: ${resultPath}`)

    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
