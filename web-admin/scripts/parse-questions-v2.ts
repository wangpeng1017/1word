import { Document, Paragraph } from 'docx'
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
async function parseDocument(filePath: string): Promise<string[]> {
    const result = await mammoth.extractRawText({ path: filePath })
    const lines = result.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l)
    return lines
}

// 解析所有文档
async function parseAllDocuments(): Promise<ParsedWordQuestions[]> {
    console.log('=========================================')
    console.log('  解析练习题文档 (v2)')
    console.log('=========================================\n')

    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.docx'))

    console.log(`找到 ${files.length} 个文档\n`)

    let allLines: string[] = []

    for (const file of files) {
        const filePath = path.join(docsDir, file)
        console.log(`解析: ${file}`)
        const lines = await parseDocument(filePath)
        allLines = allLines.concat(lines)
    }

    console.log(`\n总共读取 ${allLines.length} 行\n`)

    // 解析题目
    const results: ParsedWordQuestions[] = []
    let currentWord = ''
    let currentMeaning = ''
    let currentQuestionType = 0
    let currentOptions: { label: string; content: string }[] = []
    let currentContent = ''
    let currentWordData: ParsedWordQuestions | null = null

    for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i]

        // 匹配单词行：数字. 单词
        const wordMatch = line.match(/^(\d+)\.\s*([a-zA-Z]+)$/)
        if (wordMatch) {
            // 保存上一个单词的数据
            if (currentWordData && currentWordData.questions.length > 0) {
                results.push(currentWordData)
            }

            currentWord = wordMatch[2].toLowerCase()
            currentWordData = {
                word: currentWord,
                meaning: '',
                questions: []
            }
            currentQuestionType = 0
            currentOptions = []
            continue
        }

        // 匹配题型①：汉选英（看中文选英文）
        if (line.startsWith('①') && currentWord) {
            // 保存之前的题目
            saveCurrentQuestion()

            currentQuestionType = 1
            currentMeaning = line.replace('①', '').trim()
            currentContent = currentMeaning
            if (currentWordData) {
                currentWordData.meaning = currentMeaning
            }
            currentOptions = []
            continue
        }

        // 匹配题型②：英选汉（看英文选中文）
        if (line.startsWith('②') && currentWord) {
            saveCurrentQuestion()

            currentQuestionType = 2
            currentContent = line.replace('②', '').trim()
            currentOptions = []
            continue
        }

        // 匹配题型③：选词填空
        if (line.startsWith('③') && currentWord) {
            saveCurrentQuestion()

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
            continue
        }

        // 填空题的句子内容（可能跨行）
        if (currentQuestionType === 3 && currentOptions.length === 0 && line && !line.match(/^[A-D][\.\s]/)) {
            currentContent = currentContent + ' ' + line
        }
    }

    // 保存最后一个单词
    saveCurrentQuestion()
    if (currentWordData && currentWordData.questions.length > 0) {
        results.push(currentWordData)
    }

    function saveCurrentQuestion() {
        if (!currentWordData || currentQuestionType === 0 || currentOptions.length !== 4) return

        let type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
        let correctOption: { label: string; content: string } | undefined

        if (currentQuestionType === 1) {
            // 汉选英：选项内容=单词名
            type = 'CHINESE_TO_ENGLISH'
            correctOption = currentOptions.find(o => o.content.toLowerCase() === currentWord)
        } else if (currentQuestionType === 2) {
            // 英选汉：选项内容包含释义
            type = 'ENGLISH_TO_CHINESE'
            const meaningParts = currentMeaning.split('；')
            correctOption = currentOptions.find(o =>
                meaningParts.some(m => o.content.includes(m) || m.includes(o.content))
            )
        } else {
            // 填空题：选项内容=单词名或其变形
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

    // 统计
    let totalQuestions = 0
    results.forEach(w => totalQuestions += w.questions.length)

    console.log('=========================================')
    console.log('  解析完成!')
    console.log('=========================================')
    console.log(`单词数: ${results.length}`)
    console.log(`题目数: ${totalQuestions}`)

    // 保存解析结果
    const outputPath = path.join(process.cwd(), 'scripts', 'parsed-questions-v2.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8')
    console.log(`\n结果已保存到: ${outputPath}`)

    // 显示示例
    console.log('\n=== 示例数据 ===')
    const samples = results.slice(0, 2)
    for (const sample of samples) {
        console.log(`\n${sample.word} (${sample.meaning}):`)
        for (const q of sample.questions) {
            console.log(`  ${q.type}: ${q.content.substring(0, 40)}... [${q.correctAnswer}]`)
        }
    }

    return results
}

if (require.main === module) {
    parseAllDocuments()
}

export { parseAllDocuments, ParsedQuestion, ParsedWordQuestions }
