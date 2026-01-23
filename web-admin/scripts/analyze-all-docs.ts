/**
 * @file analyze-all-docs.ts
 * @desc 分析所有文档的格式和数量，找出遗漏的原因
 */

import * as fs from 'fs'
import * as path from 'path'
const mammoth = require('mammoth')

async function analyzeAllDocs() {
    const docsDir = path.join(process.cwd(), '..', '练习_extracted', '练习')
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.docx')).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0')
        const numB = parseInt(b.match(/\d+/)?.[0] || '0')
        return numA - numB
    })

    console.log(`共 ${files.length} 个文档\n`)
    console.log('='.repeat(60))

    let totalExpected = 0
    let totalParsed = 0

    for (const file of files) {
        const filePath = path.join(docsDir, file)
        const result = await mammoth.extractRawText({ path: filePath })
        const content = result.value
        const lines = content.split('\n').map((l: string) => l.trim()).filter((l: string) => l)

        // 从文件名推断预期数量
        const match = file.match(/第(\d+)-(\d+)个/)
        let expectedCount = 0
        if (match) {
            expectedCount = parseInt(match[2]) - parseInt(match[1]) + 1
            totalExpected += expectedCount
        }

        // 统计以数字开头的行（这是单词行）
        const numLines = lines.filter((l: string) => /^\d+[\.\s]/.test(l))

        // 检测格式
        const firstWordLine = lines.find((l: string) => /^\d+[\.\s]+[a-zA-Z]/.test(l))
        const isCompact = firstWordLine && /①/.test(firstWordLine) && /A[\.\s]/.test(firstWordLine)
        const formatType = isCompact ? '紧凑' : '换行'

        // 统计匹配的单词
        let matchedCount = 0

        if (isCompact) {
            // 紧凑格式匹配
            const compactRegex = /^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*)\s*①/
            for (const line of lines) {
                if (compactRegex.test(line)) {
                    matchedCount++
                }
            }
        } else {
            // 换行格式匹配
            const normalRegex = /^(\d+)[\.\s]+([a-zA-Z][a-zA-Z\-']*)$/
            for (const line of lines) {
                if (normalRegex.test(line)) {
                    matchedCount++
                }
            }
        }

        totalParsed += matchedCount

        const status = matchedCount >= expectedCount * 0.9 ? '✓' : '✗'
        console.log(`${status} ${file}`)
        console.log(`   预期: ${expectedCount}, 实际行数: ${numLines.length}, 匹配: ${matchedCount}, 格式: ${formatType}`)

        // 如果有明显差距，显示未匹配示例
        if (matchedCount < expectedCount * 0.9 && numLines.length > 0) {
            console.log('   未匹配示例:')
            const unmatchedSamples = numLines.slice(0, 3).map((l: string) => `     [${l.substring(0, 80)}]`)
            unmatchedSamples.forEach((s: string) => console.log(s))
        }
        console.log('')
    }

    console.log('='.repeat(60))
    console.log(`预期总数: ${totalExpected}`)
    console.log(`实际匹配: ${totalParsed}`)
    console.log(`缺失: ${totalExpected - totalParsed}`)
}

analyzeAllDocs()
