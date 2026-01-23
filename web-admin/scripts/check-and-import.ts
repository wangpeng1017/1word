/**
 * @file check-and-import.ts
 * @desc 检查数据库状态并导入题目
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
    console.log('========================================')
    console.log('  检查数据库状态')
    console.log('========================================\n')

    // 检查词库数量
    const vocabCount = await prisma.vocabularies.count()
    console.log(`词库单词数: ${vocabCount}`)

    // 检查现有题目数量
    const questionCount = await prisma.questions.count()
    console.log(`现有题目数: ${questionCount}`)

    const optionCount = await prisma.question_options.count()
    console.log(`现有选项数: ${optionCount}`)

    // 读取解析后的数据
    const dataPath = path.join(__dirname, 'parsed-questions-v2.json')
    if (!fs.existsSync(dataPath)) {
        console.log('\n⚠️  未找到 parsed-questions-v2.json，请先运行 parse-questions-v2.ts')
        await prisma.$disconnect()
        return
    }

    const parsedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    console.log(`\n解析文件中的单词数: ${parsedData.length}`)

    // 检查匹配情况
    const vocabularies = await prisma.vocabularies.findMany({ select: { word: true } })
    const vocabSet = new Set(vocabularies.map(v => v.word.toLowerCase()))

    let matched = 0
    let unmatched: string[] = []
    for (const item of parsedData) {
        if (vocabSet.has(item.word.toLowerCase())) {
            matched++
        } else {
            unmatched.push(item.word)
        }
    }

    console.log(`\n匹配词库的单词: ${matched}`)
    console.log(`未匹配的单词: ${unmatched.length}`)

    if (unmatched.length > 0 && unmatched.length <= 30) {
        console.log('\n未匹配的单词列表:')
        unmatched.forEach(w => console.log(`  - ${w}`))
    }

    await prisma.$disconnect()
}

main()
