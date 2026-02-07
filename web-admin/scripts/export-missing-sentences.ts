/**
 * @file export-missing-sentences.ts
 * @desc 导出缺失例句的填空题单词列表
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function exportMissingWords() {
    console.log('导出缺失例句的单词...\n')

    const missingQuestions = await prisma.questions.findMany({
        where: {
            type: 'FILL_IN_BLANK',
            OR: [
                { sentence: null },
                { sentence: '' }
            ]
        },
        include: {
            vocabulary: {
                select: {
                    word: true,
                    word_meanings: {
                        orderBy: { orderIndex: 'asc' },
                        take: 3
                    }
                }
            }
        },
        orderBy: {
            vocabulary: {
                word: 'asc'
            }
        }
    })

    console.log(`找到 ${missingQuestions.length} 个缺失例句的填空题\n`)

    // 生成 CSV 格式
    const csvLines = ['单词,词性,释义,例句(待补充)']

    for (const q of missingQuestions) {
        const word = q.vocabulary.word
        const meanings = q.vocabulary.word_meanings
            .map(m => `${m.partOfSpeech}. ${m.meaning}`)
            .join('; ')

        csvLines.push(`${word},"${meanings}",""`)
    }

    const csvPath = path.join(process.cwd(), 'scripts', 'missing-fill-blank-sentences.csv')
    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8')

    console.log(`✓ CSV 已保存到: ${csvPath}`)
    console.log(`\n请在 Excel 中打开此文件，在"例句"列补充内容。`)
    console.log(`格式示例: The captain was the last to ______ the sinking ship.`)
    console.log(`\n完成后，运行 import-fill-blank-sentences.ts 导入数据。`)
}

exportMissingWords()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
