/**
 * @file import-fill-blank-sentences.ts
 * @desc 从 CSV 导入填空题例句
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function importSentences() {
    console.log('导入填空题例句...\n')

    const csvPath = path.join(process.cwd(), 'scripts', 'missing-fill-blank-sentences.csv')

    if (!fs.existsSync(csvPath)) {
        console.error('错误: 找不到 CSV 文件，请先运行 export-missing-sentences.ts')
        return
    }

    const content = fs.readFileSync(csvPath, 'utf-8')
    const lines = content.split('\n').slice(1) // 跳过表头

    let updated = 0
    let skipped = 0

    for (const line of lines) {
        if (!line.trim()) continue

        // 解析 CSV（简单版，假设没有复杂的引号嵌套）
        const match = line.match(/^([^,]+),"([^"]+)","([^"]*)"$/)
        if (!match) {
            console.log(`⚠️  跳过格式错误的行: ${line}`)
            skipped++
            continue
        }

        const [, word, meanings, sentence] = match

        if (!sentence || !sentence.trim()) {
            console.log(`⚠️  ${word}: 例句为空，跳过`)
            skipped++
            continue
        }

        // 更新数据库
        const result = await prisma.questions.updateMany({
            where: {
                type: 'FILL_IN_BLANK',
                vocabulary: {
                    word: word.trim()
                },
                OR: [
                    { sentence: null },
                    { sentence: '' }
                ]
            },
            data: {
                content: sentence.trim(),
                sentence: sentence.trim()
            }
        })

        if (result.count > 0) {
            updated++
            console.log(`✓ ${word}: ${sentence}`)
        } else {
            skipped++
            console.log(`⚠️  ${word}: 未找到对应题目`)
        }
    }

    console.log(`\n完成！`)
    console.log(`- 更新: ${updated}`)
    console.log(`- 跳过: ${skipped}`)
}

importSentences()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
