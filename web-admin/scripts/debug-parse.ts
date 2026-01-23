/**
 * @file debug-parse.ts
 * @desc 调试解析脚本，检查文档格式
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

async function debugParse() {
    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.docx'))

    console.log(`共 ${files.length} 个文档\n`)

    let totalWords = 0
    let matchedWords = 0
    let unmatchedLines: string[] = []

    // 改进的正则：支持带连字符、数字的单词
    const wordRegex = /^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*[a-zA-Z]?)$/

    for (const file of files) {
        const filePath = path.join(docsDir, file)
        const result = await mammoth.extractRawText({ path: filePath })
        const lines = result.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l)

        let fileWords = 0
        for (const line of lines) {
            // 尝试匹配单词行
            if (/^\d+[\.\s]/.test(line)) {
                totalWords++
                if (wordRegex.test(line)) {
                    matchedWords++
                    fileWords++
                } else {
                    unmatchedLines.push(`${file}: ${line}`)
                }
            }
        }
        console.log(`${file}: 匹配 ${fileWords} 个单词`)
    }

    console.log(`\n总单词行数: ${totalWords}`)
    console.log(`正则匹配数: ${matchedWords}`)
    console.log(`未匹配数: ${unmatchedLines.length}`)

    if (unmatchedLines.length > 0) {
        console.log('\n未匹配行示例（前20个）:')
        unmatchedLines.slice(0, 20).forEach(l => console.log(`  ${l}`))
    }
}

debugParse()
