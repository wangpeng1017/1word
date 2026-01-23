/**
 * @file debug-no-number.ts
 * @desc 调试无编号格式解析
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

async function debug() {
    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')
    const file = '第1301-1500个.docx'
    const filePath = path.join(docsDir, file)

    const result = await mammoth.extractRawText({ path: filePath })
    const lines = result.value.split('\n').map((l: string) => l.trim()).filter((l: string) => l)

    console.log(`文件: ${file}`)
    console.log(`总行数: ${lines.length}`)

    // 检测格式
    const hasStandaloneNumber = lines.some((l: string) => /^\d+[\.\s]+[a-zA-Z][a-zA-Z\-']*$/.test(l))
    const isCompact = lines.some((l: string) => /^\d+[\.\s]+[a-zA-Z].*①.*A[\.\s]/.test(l))

    console.log(`有独立数字行: ${hasStandaloneNumber}`)
    console.log(`是紧凑格式: ${isCompact}`)

    console.log('\n前100行内容:')
    lines.slice(0, 100).forEach((line: string, i: number) => {
        console.log(`${i}: [${line.substring(0, 80)}]`)
    })
}

debug()
