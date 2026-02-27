/**
 * @file compare-e2c.ts
 * @desc 对比英选中题：Word 文档答案 vs 数据库答案
 */

import * as fs from 'fs'
import * as path from 'path'

interface WordQuestion {
    word: string
    meaning: string
    questionType: string
    options: { label: string; content: string }[]
    correctAnswer: string
    correctContent: string
}

// 读取 Word 文档答案
const wordAnswers: WordQuestion[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'word-doc-answers.json'), 'utf8')
)
const wordE2C = wordAnswers.filter(q => q.questionType === 'ENGLISH_TO_CHINESE')

// 读取数据库答案
const dbLines = fs.readFileSync(path.join(__dirname, 'db-e2c-results.txt'), 'utf8')
    .split('\n').filter(l => l.trim())

const dbE2C = new Map<string, string>()
for (const line of dbLines) {
    const [word, content] = line.split('|', 2)
    if (word && content) {
        dbE2C.set(word.trim().toLowerCase(), content.trim())
    }
}

console.log(`Word 文档英选中题: ${wordE2C.length} 道`)
console.log(`数据库英选中题: ${dbE2C.size} 道`)
console.log()

// 清除词性标注用于对比
function cleanContent(s: string): string {
    return s
        .replace(/\s*[\(（][a-z]+\.(?:\/[a-z]+\.)*[\)）]\s*/g, '')  // 去掉 (n.) (v.) (adj./n.) 等
        .replace(/\s+/g, '')  // 去空格
        .trim()
}

// 对比
const mismatches: { word: string; wordDoc: string; db: string }[] = []
const notInDb: string[] = []
const notInWord: string[] = []

for (const q of wordE2C) {
    const dbContent = dbE2C.get(q.word)
    if (!dbContent) {
        notInDb.push(q.word)
        continue
    }

    const cleanWord = cleanContent(q.correctContent)
    const cleanDb = cleanContent(dbContent)

    if (cleanWord !== cleanDb) {
        // 进一步检查：数据库内容是否包含 Word 文档内容（或反过来）
        const wordParts = cleanWord.split(/[；;,，]/).map(p => p.trim()).filter(p => p)
        const dbParts = cleanDb.split(/[；;,，]/).map(p => p.trim()).filter(p => p)

        // 如果所有 word 部分都在 db 中找到了，或反过来，认为是兼容的
        const wordInDb = wordParts.every(wp => dbParts.some(dp => dp.includes(wp) || wp.includes(dp)))
        const dbInWord = dbParts.every(dp => wordParts.some(wp => wp.includes(dp) || dp.includes(wp)))

        if (!wordInDb && !dbInWord) {
            mismatches.push({
                word: q.word,
                wordDoc: q.correctContent,
                db: dbContent
            })
        }
    }
}

// 数据库中有但 Word 文档中没有的
for (const [word] of dbE2C) {
    if (!wordE2C.find(q => q.word === word)) {
        notInWord.push(word)
    }
}

console.log(`=== 答案不一致 (${mismatches.length} 道) ===`)
for (const m of mismatches) {
    console.log(`  ${m.word}:`)
    console.log(`    Word文档: ${m.wordDoc}`)
    console.log(`    数据库:   ${m.db}`)
}

console.log(`\n=== Word文档有但数据库没有 (${notInDb.length} 个) ===`)
if (notInDb.length > 0) console.log(`  ${notInDb.join(', ')}`)

console.log(`\n=== 数据库有但Word文档没有 (${notInWord.length} 个) ===`)
if (notInWord.length > 0) console.log(`  ${notInWord.join(', ')}`)
