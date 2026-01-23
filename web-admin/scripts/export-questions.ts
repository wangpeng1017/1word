/**
 * @file export-questions.ts
 * @desc 导出题目数据用于迁移到其他服务器
 * @see PRD: docs/PRD.md#DataMigration
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ExportedQuestion {
    vocabularyWord: string
    type: string
    content: string
    sentence: string | null
    audioUrl: string | null
    correctAnswer: string
    options: {
        content: string
        isCorrect: boolean
        order: number
    }[]
}

async function exportQuestions() {
    console.log('=========================================')
    console.log('  导出题目数据')
    console.log('=========================================\n')

    // 获取所有题目及其选项
    const questions = await prisma.questions.findMany({
        include: {
            vocabularies: {
                select: { word: true }
            },
            question_options: {
                orderBy: { order: 'asc' }
            }
        }
    })

    console.log(`查询到 ${questions.length} 道题目`)

    // 转换为导出格式
    const exportData: ExportedQuestion[] = questions.map(q => ({
        vocabularyWord: q.vocabularies.word,
        type: q.type,
        content: q.content,
        sentence: q.sentence,
        audioUrl: q.audioUrl,
        correctAnswer: q.correctAnswer,
        options: q.question_options.map(o => ({
            content: o.content,
            isCorrect: o.isCorrect,
            order: o.order
        }))
    }))

    // 保存到文件
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const outputPath = path.join(__dirname, `exported-questions-${timestamp}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8')

    console.log(`\n导出完成: ${outputPath}`)
    console.log(`共 ${exportData.length} 道题目`)

    // 按类型统计
    const typeCounts: Record<string, number> = {}
    exportData.forEach(q => {
        typeCounts[q.type] = (typeCounts[q.type] || 0) + 1
    })
    console.log('\n按类型统计:')
    Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
    })

    await prisma.$disconnect()
}

if (require.main === module) {
    exportQuestions()
}

export { exportQuestions }
