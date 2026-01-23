/**
 * @file check-missing-docs.ts
 * @desc 检查最后4个文档的实际格式
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

async function checkMissingDocs() {
    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')
    const files = ['第1301-1500个.docx', '第1501-1700个.docx', '第1701-1900个.docx', '第1901-2000个.docx']

    for (const file of files) {
        const filePath = path.join(docsDir, file)
        const result = await mammoth.extractRawText({ path: filePath })
        const content = result.value
        const lines = content.split('\n').slice(0, 50) // 前50行

        console.log(`\n${'='.repeat(60)}`)
        console.log(`${file}`)
        console.log(`${'='.repeat(60)}`)
        console.log(`总字符数: ${content.length}`)
        console.log(`前50行内容:`)
        lines.forEach((line: string, i: number) => {
            const display = line.trim().substring(0, 100)
            if (display) {
                console.log(`${i}: [${display}]`)
            }
        })
    }
}

checkMissingDocs()
