/**
 * @file analyze-compact.ts
 * @desc 分析紧凑格式的变体
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

async function analyze() {
    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')

    // 检查一个紧凑格式文件
    const file = '第1051-1250个.docx'
    const filePath = path.join(docsDir, file)
    const result = await mammoth.extractRawText({ path: filePath })
    const lines = result.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l)

    console.log(`${file} 有 ${lines.length} 行\n`)

    // 统计以数字开头的行
    let numLines = 0
    let matched = 0
    const unmatched: string[] = []

    const regex = /^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*)\s*①\s*(.+?)A[\.\s]+(.+?)B[\.\s]+(.+?)C[\.\s]+(.+?)D[\.\s]+(.+?)$/

    for (const line of lines) {
        if (/^\d+[\.\s]/.test(line)) {
            numLines++
            if (regex.test(line)) {
                matched++
            } else {
                unmatched.push(line.substring(0, 100))
            }
        }
    }

    console.log(`数字开头行: ${numLines}`)
    console.log(`正则匹配: ${matched}`)
    console.log(`未匹配: ${unmatched.length}`)

    console.log('\n未匹配示例（前10个）:')
    unmatched.slice(0, 10).forEach((l, i) => console.log(`${i}: [${l}]`))
}

analyze()
