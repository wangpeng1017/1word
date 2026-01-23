/**
 * @file parse-questions-v3.ts
 * @desc 解析练习题文档（支持两种格式：换行格式 + 紧凑格式）
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

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

// 解析单个文档
async function parseDocument(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
}

// 解析紧凑格式的一行
// 格式: "18. jewellery① 中文选词珠宝A. journalB. jointC. jewelleryD. justice"
function parseCompactLine(line: string): ParsedWordQuestions | null {
    // 匹配: 数字. 单词① 中文内容A. 选项1B. 选项2C. 选项3D. 选项4
    const match = line.match(/^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*)\s*①\s*(.+?)A[\.\s]+(.+?)B[\.\s]+(.+?)C[\.\s]+(.+?)D[\.\s]+(.+?)$/)

    if (!match) return null

    const [, num, word, meaningPart, optA, optB, optC, optD] = match

    // 从meaningPart提取释义（"中文选词" + 实际释义）
    let meaning = meaningPart.replace(/中文选词/, '').trim()

    // 找到正确答案（选项中包含单词的）
    const options = [
        { label: 'A', content: optA.trim() },
        { label: 'B', content: optB.trim() },
        { label: 'C', content: optC.trim() },
        { label: 'D', content: optD.trim() },
    ]

    const correctOption = options.find(o =>
        o.content.toLowerCase() === word.toLowerCase() ||
        o.content.toLowerCase().includes(word.toLowerCase())
    )

    if (!correctOption) return null

    return {
        word: word.toLowerCase(),
        meaning,
        questions: [{
            word: word.toLowerCase(),
            type: 'CHINESE_TO_ENGLISH',
            content: meaning,
            meaning,
            options: options.map(o => ({
                ...o,
                isCorrect: o.label === correctOption.label
            })),
            correctAnswer: correctOption.label
        }]
    }
}

// 解析换行格式
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
                o.content.toLowerCase().startsWith(currentWord) ||
                currentWord.startsWith(o.content.toLowerCase().replace(/ed$|ing$|s$|es$/, ''))
            )
        }

        if (correctOption) {
            currentWordData!.questions.push({
                word: currentWord,
                type,
                content: currentContent,
                meaning: currentMeaning,
                options: currentOptions.map(o => ({
                    ...o,
                    isCorrect: o.label === correctOption!.label
                })),
                correctAnswer: correctOption.label
            })
        }

        currentQuestionType = 0
        currentOptions = []
    }

    for (const line of lines) {
        // 匹配单词行
        const wordMatch = line.match(/^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*)$/)
        if (wordMatch) {
            saveCurrentQuestion()
            if (currentWordData && currentWordData.questions.length > 0) {
                results.push(currentWordData)
            }
            currentWord = wordMatch[2].toLowerCase()
            currentWordData = { word: currentWord, meaning: '', questions: [] }
            currentQuestionType = 0
            currentOptions = []
            continue
        }

        // 匹配题型①
        if (line.startsWith('①') && currentWord) {
            saveCurrentQuestion()
            currentQuestionType = 1
            currentMeaning = line.replace('①', '').trim()
            currentContent = currentMeaning
            if (currentWordData) currentWordData.meaning = currentMeaning
            currentOptions = []
            continue
        }

        // 匹配题型②
        if (line.startsWith('②') && currentWord) {
            saveCurrentQuestion()
            currentQuestionType = 2
            currentContent = line.replace('②', '').trim()
            currentOptions = []
            continue
        }

        // 匹配题型③
        if (line.startsWith('③') && currentWord) {
            saveCurrentQuestion()
            currentQuestionType = 3
            currentContent = line.replace('③', '').replace(/选词填空[：:]?/, '').trim()
            currentOptions = []
            continue
        }

        // 匹配选项
        const optionMatch = line.match(/^([A-D])[\.\s]+(.+)$/)
        if (optionMatch && currentQuestionType > 0) {
            currentOptions.push({ label: optionMatch[1], content: optionMatch[2].trim() })
            continue
        }

        // 填空题句子
        if (currentQuestionType === 3 && currentOptions.length === 0 && line && !line.match(/^[A-D][\.\s]/)) {
            currentContent = currentContent + ' ' + line
        }
    }

    saveCurrentQuestion()
    if (currentWordData && currentWordData.questions.length > 0) {
        results.push(currentWordData)
    }

    return results
}

// 主解析函数
async function parseAllDocuments(): Promise<ParsedWordQuestions[]> {
    console.log('=========================================')
    console.log('  解析练习题文档 (v3 - 双格式支持)')
    console.log('=========================================\n')

    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.docx')).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0')
        const numB = parseInt(b.match(/\d+/)?.[0] || '0')
        return numA - numB
    })

    console.log(`找到 ${files.length} 个文档\n`)

    const allResults: ParsedWordQuestions[] = []
    let normalCount = 0
    let compactCount = 0

    for (const file of files) {
        const filePath = path.join(docsDir, file)
        console.log(`解析: ${file}`)

        const content = await parseDocument(filePath)
        const lines = content.split('\n').map(l => l.trim()).filter(l => l)

        // 检测格式：第一行是否包含 ① 和 A. B. C. D.
        const firstWordLine = lines.find(l => /^\d+[\.\s]+[a-zA-Z]/.test(l))
        const isCompact = firstWordLine && /①/.test(firstWordLine) && /A[\.\s]/.test(firstWordLine)

        if (isCompact) {
            // 紧凑格式
            let fileWords = 0
            for (const line of lines) {
                const result = parseCompactLine(line)
                if (result) {
                    allResults.push(result)
                    fileWords++
                }
            }
            compactCount += fileWords
            console.log(`  -> 紧凑格式，解析 ${fileWords} 个单词`)
        } else {
            // 换行格式
            const results = parseNormalFormat(lines)
            allResults.push(...results)
            normalCount += results.length
            console.log(`  -> 换行格式，解析 ${results.length} 个单词`)
        }
    }

    // 统计
    let totalQuestions = 0
    allResults.forEach(w => totalQuestions += w.questions.length)

    console.log('\n=========================================')
    console.log('  解析完成!')
    console.log('=========================================')
    console.log(`总单词数: ${allResults.length}`)
    console.log(`  - 换行格式: ${normalCount}`)
    console.log(`  - 紧凑格式: ${compactCount}`)
    console.log(`总题目数: ${totalQuestions}`)

    // 保存结果
    const outputPath = path.join(process.cwd(), 'scripts', 'parsed-questions-v3.json')
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8')
    console.log(`\n结果已保存到: ${outputPath}`)

    return allResults
}

if (require.main === module) {
    parseAllDocuments()
}

export { parseAllDocuments, ParsedQuestion, ParsedWordQuestions }
