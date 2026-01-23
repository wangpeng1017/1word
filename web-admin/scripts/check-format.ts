/**
 * @file check-format.ts
 * @desc 检查不同文档的格式差异
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

async function checkFormat() {
    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')

    // 检查两个文档的前30行
    const files = ['第1-200个.docx', '第1051-1250个.docx']

    for (const file of files) {
        const filePath = path.join(docsDir, file)
        const result = await mammoth.extractRawText({ path: filePath })
        const lines = result.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l)

        console.log(`\n=== ${file} (前30行) ===\n`)
        lines.slice(0, 30).forEach((line: string, i: number) => {
            console.log(`${i}: [${line}]`)
        })
    }
}

checkFormat()
