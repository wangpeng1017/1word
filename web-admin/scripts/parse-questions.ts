import { Document, Paragraph } from 'docx'
import * as fs from 'fs'
import * as path from 'path'

// 使用 mammoth 读取 Word 文档
const mammoth = require('mammoth')

interface ParsedQuestion {
    word: string
    type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    content: string
    meaning: string  // 用于判断题型②的正确答案
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

async function parseQuestionsDocument(): Promise<ParsedWordQuestions[]> {
    console.log('=========================================')
    console.log('  解析练习题文档')
    console.log('=========================================\n')

    // 读取 JSON 文件（之前已经转换过）
    const jsonPath = path.join(process.cwd(), '..', 'doc_content.json')
    const content: string[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

    console.log(`读取到 ${content.length} 行内容\n`)

    const results: ParsedWordQuestions[] = []
    let currentWord = ''
    let currentMeaning = ''
    let currentQuestionType = 0
    let currentOptions: { label: string; content: string }[] = []
    let currentContent = ''
    let questionCount = 0

    for (let i = 0; i < content.length; i++) {
        const line = content[i].trim()

        // 跳过文档标题
        if (line.startsWith('文档 ')) continue

        // 匹配单词行：数字. 单词
        const wordMatch = line.match(/^(\d+)\.\s+([a-zA-Z]+)$/)
        if (wordMatch) {
            currentWord = wordMatch[2].toLowerCase()
            currentQuestionType = 0
            currentOptions = []
            continue
        }

        // 匹配题型①：中文释义选英文
        if (line.startsWith('①') && currentWord) {
            currentQuestionType = 1
            currentMeaning = line.replace('①', '').trim()
            currentContent = currentMeaning
            currentOptions = []
            continue
        }

        // 匹配题型②：英文选中文
        if (line.startsWith('②') && currentWord) {
            // 保存题型①
            if (currentQuestionType === 1 && currentOptions.length === 4) {
                const correctOption = currentOptions.find(o => o.content.toLowerCase() === currentWord)
                if (correctOption) {
                    results.push({
                        word: currentWord,
                        questions: [{
                            word: currentWord,
                            type: 'CHINESE_TO_ENGLISH',
                            content: currentContent,
                            meaning: currentMeaning,
                            options: currentOptions.map(o => ({
                                ...o,
                                isCorrect: o.content.toLowerCase() === currentWord
                            })),
                            correctAnswer: correctOption.label
                        }]
                    })
                    questionCount++
                }
            }

            currentQuestionType = 2
            // 提取音标后的内容作为题目
            currentContent = line.replace('②', '').trim()
            currentOptions = []
            continue
        }

        // 匹配题型③：选词填空
        if (line.startsWith('③') && currentWord) {
            // 保存题型②
            if (currentQuestionType === 2 && currentOptions.length === 4) {
                // 找到与释义匹配的选项
                const correctOption = currentOptions.find(o =>
                    currentMeaning.includes(o.content) || o.content.includes(currentMeaning.split('；')[0])
                )
                if (correctOption) {
                    const lastResult = results[results.length - 1]
                    if (lastResult && lastResult.word === currentWord) {
                        lastResult.questions.push({
                            word: currentWord,
                            type: 'ENGLISH_TO_CHINESE',
                            content: currentContent,
                            meaning: currentMeaning,
                            options: currentOptions.map(o => ({
                                ...o,
                                isCorrect: o === correctOption
                            })),
                            correctAnswer: correctOption.label
                        })
                        questionCount++
                    }
                }
            }

            currentQuestionType = 3
            currentContent = line.replace('③', '').replace('选词填空：', '').replace('选词填空', '').trim()
            currentOptions = []
            continue
        }

        // 匹配选项：A/B/C/D. 内容
        const optionMatch = line.match(/^([A-D])[\.\s]+(.+)$/)
        if (optionMatch && currentQuestionType > 0) {
            currentOptions.push({
                label: optionMatch[1],
                content: optionMatch[2].trim()
            })

            // 题型③收集完4个选项后保存
            if (currentQuestionType === 3 && currentOptions.length === 4) {
                // 找到与单词匹配的选项（模糊匹配）
                const correctOption = currentOptions.find(o =>
                    o.content.toLowerCase() === currentWord ||
                    o.content.toLowerCase().startsWith(currentWord) ||
                    currentWord.startsWith(o.content.toLowerCase())
                )
                if (correctOption) {
                    const lastResult = results[results.length - 1]
                    if (lastResult && lastResult.word === currentWord) {
                        lastResult.questions.push({
                            word: currentWord,
                            type: 'FILL_IN_BLANK',
                            content: currentContent,
                            meaning: currentMeaning,
                            options: currentOptions.map(o => ({
                                ...o,
                                isCorrect: o === correctOption
                            })),
                            correctAnswer: correctOption.label
                        })
                        questionCount++
                    }
                }
                currentQuestionType = 0
            }
            continue
        }

        // 如果是填空题的句子内容（在③之后，选项之前）
        if (currentQuestionType === 3 && currentOptions.length === 0 && line && !line.match(/^[A-D][\.\s]/)) {
            currentContent = currentContent + ' ' + line
        }
    }

    // 合并相同单词的题目
    const mergedResults: ParsedWordQuestions[] = []
    const wordMap = new Map<string, ParsedWordQuestions>()

    for (const result of results) {
        const existing = wordMap.get(result.word)
        if (existing) {
            existing.questions.push(...result.questions)
        } else {
            wordMap.set(result.word, result)
            mergedResults.push(result)
        }
    }

    console.log(`解析完成:`)
    console.log(`  - 单词数: ${mergedResults.length}`)
    console.log(`  - 题目数: ${questionCount}`)

    // 保存解析结果
    const outputPath = path.join(process.cwd(), 'scripts', 'parsed-questions.json')
    fs.writeFileSync(outputPath, JSON.stringify(mergedResults, null, 2), 'utf-8')
    console.log(`\n解析结果已保存到: ${outputPath}`)

    // 显示示例
    console.log('\n=== 示例数据 ===')
    const samples = mergedResults.slice(0, 3)
    for (const sample of samples) {
        console.log(`\n${sample.word}:`)
        for (const q of sample.questions) {
            console.log(`  ${q.type}: ${q.content.substring(0, 50)}...`)
            console.log(`    正确答案: ${q.correctAnswer}`)
        }
    }

    return mergedResults
}

if (require.main === module) {
    parseQuestionsDocument()
}

export { parseQuestionsDocument, ParsedQuestion, ParsedWordQuestions }
