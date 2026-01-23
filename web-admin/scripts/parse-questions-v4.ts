/**
 * @file parse-questions-v4.ts
 * @desc 解析练习题文档（支持三种格式：换行/紧凑/无编号）+ UNKNOWN答案处理
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

interface ParsedQuestion {
    word: string
    type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    content: string
    meaning: string
    options: { label: string; content: string; isCorrect: boolean }[]
    correctAnswer: string
}

interface ParsedWordQuestions {
    word: string
    meaning: string
    questions: ParsedQuestion[]
}

async function parseDocument(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
}

// 格式1: 换行格式 (1. abandon)
function parseNormalFormat(lines: string[]): ParsedWordQuestions[] {
    const results: ParsedWordQuestions[] = []
    let currentWord = ''
    let currentMeaning = ''
    let currentQuestionType = 0
    let currentOptions: { label: string; content: string }[] = []
    let currentContent = ''
    let currentWordData: ParsedWordQuestions | null = null

    function saveCurrentQuestion() {
        if (!currentWordData || currentQuestionType === 0 || currentOptions.length !== 4) return
        let type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
        let correctOption: { label: string; content: string } | undefined

        if (currentQuestionType === 1) {
            type = 'CHINESE_TO_ENGLISH'
            correctOption = currentOptions.find(o => o.content.toLowerCase() === currentWord)
        } else if (currentQuestionType === 2) {
            type = 'ENGLISH_TO_CHINESE'
            const meaningParts = currentMeaning.split(/[；;,，]/)
            correctOption = currentOptions.find(o =>
                meaningParts.some(m => o.content.includes(m.trim()) || m.trim().includes(o.content))
            )
        } else {
            type = 'FILL_IN_BLANK'
            correctOption = currentOptions.find(o =>
                o.content.toLowerCase() === currentWord ||
                o.content.toLowerCase().startsWith(currentWord)
            )
        }

        if (correctOption) {
            currentWordData.questions.push({
                word: currentWord, type, content: currentContent, meaning: currentMeaning,
                options: currentOptions.map(o => ({ ...o, isCorrect: o.label === correctOption!.label })),
                correctAnswer: correctOption.label
            })
        }
        currentQuestionType = 0
        currentOptions = []
    }

    for (const line of lines) {
        const wordMatch = line.match(/^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*)$/)
        if (wordMatch) {
            saveCurrentQuestion()
            if (currentWordData && currentWordData.questions.length > 0) results.push(currentWordData)
            currentWord = wordMatch[2].toLowerCase()
            currentWordData = { word: currentWord, meaning: '', questions: [] }
            currentQuestionType = 0
            currentOptions = []
            continue
        }
        if (line.startsWith('①') && currentWord) {
            saveCurrentQuestion()
            currentQuestionType = 1
            currentMeaning = line.replace('①', '').trim()
            currentContent = currentMeaning
            if (currentWordData) currentWordData.meaning = currentMeaning
            currentOptions = []
            continue
        }
        if (line.startsWith('②') && currentWord) {
            saveCurrentQuestion()
            currentQuestionType = 2
            currentContent = line.replace('②', '').trim()
            currentOptions = []
            continue
        }
        if (line.startsWith('③') && currentWord) {
            saveCurrentQuestion()
            currentQuestionType = 3
            currentContent = line.replace('③', '').replace(/选词填空[：:]?/, '').trim()
            currentOptions = []
            continue
        }
        const optionMatch = line.match(/^([A-D])[\.\s]+(.+)$/)
        if (optionMatch && currentQuestionType > 0) {
            currentOptions.push({ label: optionMatch[1], content: optionMatch[2].trim() })
            continue
        }
    }
    saveCurrentQuestion()
    if (currentWordData && currentWordData.questions.length > 0) results.push(currentWordData)
    return results
}

// 格式2: 紧凑格式 (18. jewellery① 中文选词珠宝A. ...)
function parseCompactFormat(lines: string[]): ParsedWordQuestions[] {
    const results: ParsedWordQuestions[] = []
    const regex = /^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*)\s*①\s*(.+?)A[\.\s]+(.+?)B[\.\s]+(.+?)C[\.\s]+(.+?)D[\.\s]+(.+?)$/

    for (const line of lines) {
        const match = line.match(regex)
        if (!match) continue
        const [, num, word, meaningPart, optA, optB, optC, optD] = match
        const meaning = meaningPart.replace(/中文选词/, '').trim()
        const options = [
            { label: 'A', content: optA.trim() },
            { label: 'B', content: optB.trim() },
            { label: 'C', content: optC.trim() },
            { label: 'D', content: optD.trim() },
        ]
        const correctOption = options.find(o => o.content.toLowerCase() === word.toLowerCase())
        if (correctOption) {
            results.push({
                word: word.toLowerCase(), meaning,
                questions: [{
                    word: word.toLowerCase(), type: 'CHINESE_TO_ENGLISH', content: meaning, meaning,
                    options: options.map(o => ({ ...o, isCorrect: o.label === correctOption.label })),
                    correctAnswer: correctOption.label
                }]
            })
        }
    }
    return results
}

// 格式3: 无编号格式 (混合模式：支持 originA. ... 和 origin \n A. ... )
function parseNoNumberFormat(lines: string[]): ParsedWordQuestions[] {
    const results: ParsedWordQuestions[] = []

    // 内联模式正则: 单词A. 选项1B. 选项2...
    const inlineRegex = /^([a-zA-Z][a-zA-Z\-']+)A[\.\s]+(.+?)B[\.\s]+(.+?)C[\.\s]+(.+?)D[\.\s]+(.+?)$/

    let i = 0
    while (i < lines.length) {
        const line = lines[i].trim()

        // 1. 尝试内联模式
        const inlineMatch = line.match(inlineRegex)
        if (inlineMatch) {
            const [, word, optA, optB, optC, optD] = inlineMatch
            const wordLower = word.toLowerCase()
            const options = [
                { label: 'A', content: optA.trim() },
                { label: 'B', content: optB.trim() },
                { label: 'C', content: optC.trim() },
                { label: 'D', content: optD.trim() },
            ]
            pushQuestion(results, wordLower, options)
            i++
            continue
        }

        // 2. 尝试多行模式 (当前行是单词)
        if (/^[a-zA-Z][a-zA-Z\-']*$/.test(line) && !['A', 'B', 'C', 'D'].includes(line)) {
            const wordLower = line.toLowerCase()
            const options: { label: string; content: string }[] = []

            // 预读后续行找选项
            let j = i + 1
            while (j < lines.length && options.length < 4) {
                const subLine = lines[j].trim()
                const optMatch = subLine.match(/^([A-D])[\.\s]+(.+)$/)
                if (optMatch) {
                    options.push({ label: optMatch[1], content: optMatch[2].trim() })
                    j++
                } else if (/^[a-zA-Z][a-zA-Z\-']*$/.test(subLine) && !['A', 'B', 'C', 'D'].includes(subLine) && !subLine.match(inlineRegex)) {
                    // 遇到下一个新单词（且不是选项也不是内联行），停止
                    break
                } else {
                    j++ // 跳过无关行
                }
            }

            if (options.length === 4) {
                pushQuestion(results, wordLower, options)
                i = j // 跳过已处理的行
                continue
            }
        }

        i++
    }

    return results
}

function pushQuestion(results: ParsedWordQuestions[], wordLower: string, options: { label: string; content: string }[]) {
    // 找正确答案：选项内容是单词本身（英选汉题型）
    const correctOption = options.find(o =>
        o.content.toLowerCase() === wordLower ||
        o.content.toLowerCase().startsWith(wordLower)
    )

    // 即使没找到正确答案（可能因为是汉选英题目），也要保存题目，标记为UNKNOWN
    const correctAnswer = correctOption ? correctOption.label : 'UNKNOWN'

    // 找释义
    let meaning = ''
    if (correctOption) {
        meaning = options.find(o => o.label !== correctOption!.label)?.content || ''
    } else {
        meaning = 'UNKNOWN'
    }

    results.push({
        word: wordLower,
        meaning,
        questions: [{
            word: wordLower,
            type: 'ENGLISH_TO_CHINESE', // 给英文单词选中文释义
            content: wordLower,
            meaning,
            options: options.map(o => ({ ...o, isCorrect: o.label === correctAnswer })),
            correctAnswer
        }]
    })
}

async function parseAllDocuments(): Promise<ParsedWordQuestions[]> {
    console.log('=========================================')
    console.log('  解析练习题文档 (v4 - 三格式支持)')
    console.log('=========================================\n')

    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.docx')).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0')
        const numB = parseInt(b.match(/\d+/)?.[0] || '0')
        return numA - numB
    })

    console.log(`找到 ${files.length} 个文档\n`)
    const allResults: ParsedWordQuestions[] = []
    let stats = { normal: 0, compact: 0, noNumber: 0 }

    for (const file of files) {
        const filePath = path.join(docsDir, file)
        console.log(`解析: ${file}`)
        const content = await parseDocument(filePath)
        const lines = content.split('\n').map(l => l.trim()).filter(l => l)

        // 检测格式 - 更精确的检测
        const hasStandaloneNumber = lines.some(l => /^\d+[\.\s]+[a-zA-Z][a-zA-Z\-']*$/.test(l))
        const isCompact = lines.some(l => /^\d+[\.\s]+[a-zA-Z].*①.*A[\.\s]/.test(l))
        const hasAnyNumber = lines.some(l => /^\d+[\.\s]+[a-zA-Z]/.test(l))

        let results: ParsedWordQuestions[] = []
        if (hasStandaloneNumber) {
            // 有独立的数字+单词行，使用换行格式
            results = parseNormalFormat(lines)
            stats.normal += results.length
            console.log(`  -> 换行格式，解析 ${results.length} 个单词`)
        } else if (isCompact) {
            // 紧凑格式
            results = parseCompactFormat(lines)
            stats.compact += results.length
            console.log(`  -> 紧凑格式，解析 ${results.length} 个单词`)
        } else {
            // 无编号格式 (Hybrid)
            console.log(`  -> 检测为无编号格式 (lines: ${lines.length})`)
            results = parseNoNumberFormat(lines)
            stats.noNumber += results.length
            console.log(`  -> 无编号格式，解析 ${results.length} 个单词`)
            if (results.length === 0 && lines.length > 0) {
                console.log(`    First line: [${lines[0]}]`)
                console.log(`    Regex test: ${/^([a-zA-Z][a-zA-Z\-']+)A[\.\s]+(.+?)B[\.\s]+(.+?)C[\.\s]+(.+?)D[\.\s]+(.+?)$/.test(lines[0])}`)
            }
        }
        allResults.push(...results)
    }

    let totalQuestions = 0
    allResults.forEach(w => totalQuestions += w.questions.length)

    console.log('\n=========================================')
    console.log('  解析完成!')
    console.log('=========================================')
    console.log(`总单词数: ${allResults.length}`)
    console.log(`  - 换行格式: ${stats.normal}`)
    console.log(`  - 紧凑格式: ${stats.compact}`)
    console.log(`  - 无编号格式: ${stats.noNumber}`)
    console.log(`总题目数: ${totalQuestions}`)

    const outputPath = path.join(process.cwd(), 'scripts', 'parsed-questions-v4.json')
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8')
    console.log(`\n结果已保存到: ${outputPath}`)

    return allResults
}

if (require.main === module) {
    parseAllDocuments()
}

export { parseAllDocuments, ParsedQuestion, ParsedWordQuestions }
