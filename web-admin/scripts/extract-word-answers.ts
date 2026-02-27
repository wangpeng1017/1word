/**
 * @file extract-word-answers.ts  
 * @desc 从原始 Word 文档中提取所有题目的正确答案（支持四种格式）
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

interface WordQuestion {
    word: string
    meaning: string
    questionType: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    options: { label: string; content: string }[]
    correctAnswer: string
    correctContent: string
}

// ======== 从一行文本中提取 A/B/C/D 选项 ========
function extractOptions(text: string): { label: string; content: string }[] {
    const opts: { label: string; content: string }[] = []
    const regex = /([A-D])\.\s*(.+?)(?=(?:\s*[A-D]\.\s)|$)/g
    let m
    while ((m = regex.exec(text)) !== null) {
        opts.push({ label: m[1], content: m[2].trim() })
    }
    return opts
}

// ======== 确定正确答案 ========
function determineCorrectAnswer(
    word: string,
    meaning: string,
    questionType: number,
    options: { label: string; content: string }[]
): WordQuestion | null {
    let type: 'CHINESE_TO_ENGLISH' | 'ENGLISH_TO_CHINESE' | 'FILL_IN_BLANK'
    let correctAnswer = ''
    let correctContent = ''

    if (questionType === 1) {
        // 中选英: 正确答案 = 选项内容是单词本身
        type = 'CHINESE_TO_ENGLISH'
        const match = options.find(o => o.content.toLowerCase().replace(/[^a-z\-']/g, '') === word.toLowerCase())
        if (match) { correctAnswer = match.label; correctContent = match.content }
    } else if (questionType === 2) {
        // 英选中: 正确答案 = 选项包含释义
        type = 'ENGLISH_TO_CHINESE'
        if (meaning) {
            // 清理 meaning 中的词性标注如 (n.) (v.) (adj.)
            const cleanMeaning = meaning.replace(/\s*[\(（][a-z]+\.[\)）]\s*/g, '').trim()
            const meaningParts = cleanMeaning.split(/[；;,，]/).map(m => m.trim()).filter(m => m.length > 0)
            let match = options.find(o => {
                const cleanOpt = o.content.replace(/\s*[\(（][a-z]+\.[\)）]\s*/g, '').trim()
                return cleanOpt === cleanMeaning
            })
            if (!match) {
                let bestMatch: typeof options[0] | null = null
                let bestScore = 0
                for (const opt of options) {
                    let score = 0
                    const cleanOpt = opt.content.replace(/\s*[\(（][a-z]+\.[\)）]\s*/g, '').trim()
                    for (const m of meaningParts) {
                        if (cleanOpt === m) score += 10
                        else if (cleanOpt.includes(m)) score += 5
                        else if (m.includes(cleanOpt)) score += 3
                    }
                    if (score > bestScore) { bestScore = score; bestMatch = opt }
                }
                if (bestMatch && bestScore > 0) match = bestMatch
            }
            if (match) { correctAnswer = match.label; correctContent = match.content }
        }
    } else {
        // 填空: 正确答案 = 选项是单词或变体
        type = 'FILL_IN_BLANK'
        let match = options.find(o => o.content.toLowerCase().replace(/[^a-z\-']/g, '') === word.toLowerCase())
        if (!match) {
            const candidates = options.filter(o => o.content.toLowerCase().startsWith(word.toLowerCase()))
            if (candidates.length >= 1) {
                match = candidates.sort((a, b) => a.content.length - b.content.length)[0]
            }
        }
        if (match) { correctAnswer = match.label; correctContent = match.content }
    }

    if (!correctAnswer) return null
    return { word, meaning, questionType: type!, options: [...options], correctAnswer, correctContent }
}

// ======== 格式1: 换行格式 (带①②③和编号) ========
function parseNormalFormat(lines: string[]): WordQuestion[] {
    const questions: WordQuestion[] = []
    let currentWord = ''
    let currentMeaning = ''
    let currentQuestionType = 0
    let currentOptions: { label: string; content: string }[] = []

    function save() {
        if (!currentWord || currentQuestionType === 0 || currentOptions.length < 3) return
        const q = determineCorrectAnswer(currentWord, currentMeaning, currentQuestionType, currentOptions)
        if (q) questions.push(q)
    }

    for (const line of lines) {
        const wordMatch = line.match(/^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*)$/)
        if (wordMatch) { save(); currentWord = wordMatch[2].toLowerCase(); currentMeaning = ''; currentQuestionType = 0; currentOptions = []; continue }
        if (line.startsWith('①') && currentWord) { save(); currentQuestionType = 1; currentMeaning = line.replace('①', '').trim(); currentOptions = []; continue }
        if (line.startsWith('②') && currentWord) { save(); currentQuestionType = 2; currentOptions = []; continue }
        if (line.startsWith('③') && currentWord) { save(); currentQuestionType = 3; currentOptions = []; continue }
        const optionMatch = line.match(/^([A-D])[\.\s]+(.+)$/)
        if (optionMatch && currentQuestionType > 0) { currentOptions.push({ label: optionMatch[1], content: optionMatch[2].trim() }) }
    }
    save()
    return questions
}

// ======== 格式2: 紧凑格式 (一行包含标号和选项) ========
function parseCompactFormat(text: string): WordQuestion[] {
    const questions: WordQuestion[] = []
    const wordBlockRegex = /(\d+)\.\s*([a-zA-Z][a-zA-Z\-']*)\s*①/g
    const blocks: { word: string, startIdx: number }[] = []
    let match
    while ((match = wordBlockRegex.exec(text)) !== null) {
        blocks.push({ word: match[2].toLowerCase(), startIdx: match.index })
    }

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const endIdx = i + 1 < blocks.length ? blocks[i + 1].startIdx : text.length
        const blockText = text.substring(block.startIdx, endIdx)
        const parts = blockText.split(/(?=①|②|③)/)
        let meaning = ''
        for (const part of parts) {
            let questionType = 0
            if (part.startsWith('①')) questionType = 1
            else if (part.startsWith('②')) questionType = 2
            else if (part.startsWith('③')) questionType = 3
            else continue
            const options = extractOptions(part)
            if (questionType === 1) {
                const meaningMatch = part.match(/①\s*(?:中文选词)?\s*(.+?)(?=[A-D]\.)/)
                if (meaningMatch) meaning = meaningMatch[1].trim()
            }
            if (options.length >= 3) {
                const q = determineCorrectAnswer(block.word, meaning, questionType, options)
                if (q) questions.push(q)
            }
        }
    }
    return questions
}

// ======== 格式3: 无编号紧凑格式 (如 originA. ...B. ...C. ...D. ...) ========
function parseNoNumberCompact(lines: string[]): WordQuestion[] {
    const questions: WordQuestion[] = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const e2cMatch = line.match(/^([a-zA-Z][a-zA-Z\-']*)\s*(A\..+)$/i)
        if (e2cMatch) {
            const word = e2cMatch[1].toLowerCase()
            const options = extractOptions(e2cMatch[2])
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1]
                const c2eMatch = nextLine.match(/^(.+?)\s*(A\.\s*[a-zA-Z].+)$/i)
                if (c2eMatch) {
                    const meaning = c2eMatch[1].trim()
                    const c2eOptions = extractOptions(c2eMatch[2])
                    if (options.length >= 3) {
                        const q = determineCorrectAnswer(word, meaning, 2, options)
                        if (q) questions.push(q)
                    }
                    if (c2eOptions.length >= 3) {
                        const q = determineCorrectAnswer(word, meaning, 1, c2eOptions)
                        if (q) questions.push(q)
                    }
                    if (i + 2 < lines.length) {
                        const fillLine = lines[i + 2]
                        const fillMatch = fillLine.match(/^(.+?)\s*(A\..+)$/i)
                        if (fillMatch) {
                            const fillOptions = extractOptions(fillMatch[2])
                            if (fillOptions.length >= 3) {
                                const q = determineCorrectAnswer(word, meaning, 3, fillOptions)
                                if (q) questions.push(q)
                            }
                        }
                    }
                    i += 2
                }
            }
        }
    }
    return questions
}

// ======== 格式4: 无编号换行格式 (每行一个选项) ========
// receipt
// A. 接待；招待会（n.）
// B. 收据；收条（n.）
// C. 配方；食谱（n.）
// D. 背诵；叙述（v.）
// 收据；收条
// A. reception
// B. receipt
// C. recipe
// D. recite
// The cashier gave...
// A. reception
// B. receipt
// C. recipe
// D. recite
function parseNoNumberNewline(lines: string[]): WordQuestion[] {
    const questions: WordQuestion[] = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]

        // 检测是否是英文单词行（不含选项、空格少）
        if (/^[a-zA-Z][a-zA-Z\-']*$/.test(line)) {
            const word = line.toLowerCase()

            // 尝试读取3组题目(英选中、中选英、填空)

            // ---- 第1题: 英选中 (4个中文选项) ----
            const opts1: { label: string; content: string }[] = []
            let j = i + 1
            while (j < lines.length && /^[A-D]\.\s/.test(lines[j])) {
                const m = lines[j].match(/^([A-D])\.\s*(.+)$/)
                if (m) opts1.push({ label: m[1], content: m[2].trim() })
                j++
            }

            if (opts1.length < 3) { i++; continue }

            // ---- 中文释义行 ----
            if (j >= lines.length) { i = j; continue }
            const meaningLine = lines[j]
            // 释义行应该是中文
            if (/^[a-zA-Z]/.test(meaningLine) || /^[A-D]\./.test(meaningLine)) { i++; continue }
            const meaning = meaningLine.trim()
            j++

            // ---- 第2题: 中选英 (4个英文选项) ----
            const opts2: { label: string; content: string }[] = []
            while (j < lines.length && /^[A-D]\.\s/.test(lines[j])) {
                const m = lines[j].match(/^([A-D])\.\s*(.+)$/)
                if (m) opts2.push({ label: m[1], content: m[2].trim() })
                j++
            }

            // ---- 第3题: 填空 (句子 + 4个选项) ----
            let fillSentence = ''
            const opts3: { label: string; content: string }[] = []
            if (j < lines.length && !/^[a-zA-Z][a-zA-Z\-']*$/.test(lines[j]) && !/^[A-D]\./.test(lines[j])) {
                fillSentence = lines[j]
                j++
                while (j < lines.length && /^[A-D]\.\s/.test(lines[j])) {
                    const m = lines[j].match(/^([A-D])\.\s*(.+)$/)
                    if (m) opts3.push({ label: m[1], content: m[2].trim() })
                    j++
                }
            }

            // 保存题目
            if (opts1.length >= 3) {
                const q = determineCorrectAnswer(word, meaning, 2, opts1)
                if (q) questions.push(q)
            }
            if (opts2.length >= 3) {
                const q = determineCorrectAnswer(word, meaning, 1, opts2)
                if (q) questions.push(q)
            }
            if (opts3.length >= 3) {
                const q = determineCorrectAnswer(word, meaning, 3, opts3)
                if (q) questions.push(q)
            }

            i = j
            continue
        }
        i++
    }
    return questions
}

async function main() {
    const docDir = path.resolve(__dirname, '../../练习_extracted/练习')
    const files = fs.readdirSync(docDir).filter(f => f.endsWith('.docx')).sort()

    let allQuestions: WordQuestion[] = []
    for (const file of files) {
        const filePath = path.join(docDir, file)
        const result = await mammoth.extractRawText({ path: filePath })
        const rawText = result.value
        const lines = rawText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)

        // 判断格式
        const hasCircleNumbers = lines.some((l: string) => l.startsWith('①'))
        const hasNumberedWords = lines.some((l: string) => /^\d+[\.\s]+[a-zA-Z]/.test(l))
        const isCompactOneLine = lines.some((l: string) => /①.*A\..*B\..*C\..*D\./.test(l))
        const hasNoNumberCompact = !hasCircleNumbers && !hasNumberedWords &&
            lines.some((l: string) => /^[a-zA-Z][a-zA-Z\-']*\s*A\./.test(l))
        const hasNoNumberNewline = !hasCircleNumbers && !hasNumberedWords && !hasNoNumberCompact &&
            lines.some((l: string) => /^[a-zA-Z][a-zA-Z\-']*$/.test(l))

        let questions: WordQuestion[] = []
        let format = ''

        if (isCompactOneLine) {
            questions = parseCompactFormat(rawText)
            format = '紧凑格式'
        } else if (hasNumberedWords && hasCircleNumbers) {
            questions = parseNormalFormat(lines)
            format = '换行格式'
        } else if (hasNoNumberCompact) {
            questions = parseNoNumberCompact(lines)
            format = '无编号紧凑格式'
        } else if (hasNoNumberNewline) {
            questions = parseNoNumberNewline(lines)
            format = '无编号换行格式'
        } else {
            format = '未知格式'
        }

        console.error(`${file}: ${questions.length} 道题 (${format})`)
        allQuestions = allQuestions.concat(questions)
    }
    console.error(`\n总计: ${allQuestions.length} 道题`)

    const seen = new Set<string>()
    const unique: WordQuestion[] = []
    for (const q of allQuestions) {
        const key = `${q.word}|${q.questionType}`
        if (!seen.has(key)) { seen.add(key); unique.push(q) }
    }
    console.error(`去重后: ${unique.length} 道题`)

    fs.writeFileSync(path.join(__dirname, 'word-doc-answers.json'), JSON.stringify(unique, null, 2), 'utf8')
    console.error(`已保存到 word-doc-answers.json`)
}

main().catch(e => { console.error(e); process.exit(1) })
