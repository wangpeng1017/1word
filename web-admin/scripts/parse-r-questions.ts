import * as fs from 'fs'
import * as path from 'path'

const mammoth = require('mammoth')

interface ParsedQuestion {
    word: string
    type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    content: string
    options: { label: string; content: string; isCorrect: boolean }[]
    correctAnswer: string
}

interface ParsedWordData {
    word: string
    meaning: string
    questions: ParsedQuestion[]
}

async function parseRWordsDocument(): Promise<ParsedWordData[]> {
    console.log('=========================================')
    console.log('  解析 R 开头单词的文档')
    console.log('=========================================\n')

    // 主要是第1501-1700个.docx 包含 R 开头单词
    const docPath = path.join(process.cwd(), '..', '练习_extracted', '练习', '第1501-1700个.docx')

    const result = await mammoth.extractRawText({ path: docPath })
    const lines = result.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l)

    console.log(`读取到 ${lines.length} 行\n`)

    const results: ParsedWordData[] = []
    let currentWord = ''
    let currentMeaning = ''
    let currentQuestionType = 0
    let currentOptions: { label: string; content: string }[] = []
    let currentContent = ''
    let currentWordData: ParsedWordData | null = null

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // 匹配单独的英文单词行（R开头）
        if (/^[rR][a-z]+$/.test(line)) {
            // 保存前一个单词
            saveCurrentQuestion()
            if (currentWordData && currentWordData.questions.length > 0) {
                results.push(currentWordData)
            }

            currentWord = line.toLowerCase()
            currentWordData = { word: currentWord, meaning: '', questions: [] }
            currentQuestionType = 0
            currentOptions = []
            continue
        }

        // 中文释义行（紧跟在单词后面的第一个中文行）
        if (currentWord && !currentMeaning && /[\u4e00-\u9fa5]/.test(line) && !line.startsWith('A.') && !line.startsWith('B.') && !line.startsWith('C.') && !line.startsWith('D.')) {
            currentMeaning = line
            if (currentWordData) {
                currentWordData.meaning = currentMeaning
            }
            // 这是题型1的题目内容
            currentQuestionType = 1
            currentContent = currentMeaning
            currentOptions = []
            continue
        }

        // 匹配选项
        const optionMatch = line.match(/^([A-D])[\.\s]+(.+)$/)
        if (optionMatch && currentQuestionType > 0) {
            currentOptions.push({
                label: optionMatch[1],
                content: optionMatch[2].trim()
            })

            // 收集满4个选项后，判断题型并保存
            if (currentOptions.length === 4) {
                saveCurrentQuestion()

                // 判断下一个题型
                if (currentQuestionType === 1) {
                    currentQuestionType = 2 // 英选汉
                } else if (currentQuestionType === 2) {
                    currentQuestionType = 3 // 填空题
                } else {
                    currentQuestionType = 0
                    currentMeaning = '' // 重置为下一个单词准备
                }
            }
            continue
        }

        // 填空句子（包含 ___）
        if (line.includes('___') || line.includes('____')) {
            currentQuestionType = 3
            currentContent = line
            currentOptions = []
            continue
        }
    }

    // 保存最后一个
    saveCurrentQuestion()
    if (currentWordData && currentWordData.questions.length > 0) {
        results.push(currentWordData)
    }

    function saveCurrentQuestion() {
        if (!currentWordData || currentQuestionType === 0 || currentOptions.length !== 4) return

        let type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
        let correctOption: { label: string; content: string } | undefined

        if (currentQuestionType === 1) {
            // 汉选英
            type = 'CHINESE_TO_ENGLISH'
            correctOption = currentOptions.find(o => o.content.toLowerCase() === currentWord)
        } else if (currentQuestionType === 2) {
            // 英选汉
            type = 'ENGLISH_TO_CHINESE'
            const meaningPart = currentMeaning.split('；')[0].split('（')[0].trim()
            correctOption = currentOptions.find(o =>
                o.content.includes(meaningPart) || meaningPart.includes(o.content.split('（')[0].trim())
            )
        } else {
            // 填空题
            type = 'FILL_IN_BLANK'
            correctOption = currentOptions.find(o =>
                o.content.toLowerCase() === currentWord ||
                o.content.toLowerCase().replace(/ed$|ing$|s$|es$|ly$/, '') === currentWord.replace(/e$/, '')
            )
        }

        if (correctOption) {
            currentWordData!.questions.push({
                word: currentWord,
                type,
                content: currentContent,
                options: currentOptions.map(o => ({
                    ...o,
                    isCorrect: o.label === correctOption!.label
                })),
                correctAnswer: correctOption.label
            })
        }

        currentOptions = []
    }

    // 只保留R开头的
    const rResults = results.filter(r => r.word.startsWith('r'))

    console.log(`解析到 ${rResults.length} 个 R 开头单词`)
    let totalQ = 0
    rResults.forEach(r => totalQ += r.questions.length)
    console.log(`共 ${totalQ} 道题目`)

    // 保存
    const outputPath = path.join(process.cwd(), 'scripts', 'parsed-r-questions.json')
    fs.writeFileSync(outputPath, JSON.stringify(rResults, null, 2), 'utf-8')
    console.log(`\n已保存到: ${outputPath}`)

    // 示例
    console.log('\n=== 示例 ===')
    rResults.slice(0, 3).forEach(r => {
        console.log(`${r.word}: ${r.questions.length} 题`)
        r.questions.forEach(q => console.log(`  ${q.type}: ${q.correctAnswer}`))
    })

    return rResults
}

if (require.main === module) {
    parseRWordsDocument()
}

export { parseRWordsDocument }
