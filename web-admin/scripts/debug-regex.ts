/**
 * @file debug-regex.ts
 * @desc 调试无编号格式的这则匹配
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

async function debugRegex() {
    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')
    const file = '第1301-1500个.docx'
    const filePath = path.join(docsDir, file)

    const result = await mammoth.extractRawText({ path: filePath })
    const lines = result.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l)

    // 测试第一行
    const line0 = lines[0]
    console.log(`Line 0: [${line0}]`)

    // 打印字符编码，检查是否有怪异字符
    console.log('Char codes:')
    for (let i = 0; i < Math.min(line0.length, 20); i++) {
        console.log(`${i}: ${line0[i]} (${line0.charCodeAt(i)})`)
    }

    const regex = /^([a-zA-Z][a-zA-Z\-']+)A[\.\s]+(.+?)B[\.\s]+(.+?)C[\.\s]+(.+?)D[\.\s]+(.+?)$/
    const match = line0.match(regex)
    console.log(`\nRegex match base: ${!!match}`)

    if (!match) {
        // 尝试简化正则来定位问题
        console.log('Testing simplified regexes:')
        console.log(`StartsWith Word+A: ${/^[a-zA-Z]+A/.test(line0)}`)
        console.log(`Word+A.+B: ${/^[a-zA-Z]+A.+B/.test(line0)}`)
        console.log(`Word+A.+B.+C: ${/^[a-zA-Z]+A.+B.+C/.test(line0)}`)
    }
}

debugRegex()
