/**
 * @file import-quiz-questions.ts
 * @desc 导入词汇量测试题目到数据库
 * @see PRD: docs/PRD.md#VocabularyQuiz
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface QuizQuestion {
    questionNo: number
    word?: string
    questionText?: string
    questionType: 'ENGLISH_TO_CHINESE' | 'CHINESE_TO_ENGLISH' | 'CONFUSABLE_WORDS'
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    optionE: string
    correctOption: string
    difficulty: number
}

async function importQuizQuestions() {
    try {
        // 读取 JSON 文件
        const jsonPath = path.join(__dirname, 'quiz-questions.json')
        const jsonData = fs.readFileSync(jsonPath, 'utf-8')
        const questions: QuizQuestion[] = JSON.parse(jsonData)

        console.log(`准备导入 ${questions.length} 道题目...`)

        // 清空现有数据
        await prisma.vocabulary_quiz_answers.deleteMany({})
        await prisma.vocabulary_quiz_records.deleteMany({})
        await prisma.vocabulary_quiz_questions.deleteMany({})
        console.log('已清空现有数据')

        // 批量插入
        let successCount = 0
        for (const q of questions) {
            try {
                await prisma.vocabulary_quiz_questions.create({
                    data: {
                        id: `vqq_${q.questionNo}_${Date.now()}`,
                        questionNo: q.questionNo,
                        word: q.word || null,
                        questionText: q.questionText || null,
                        questionType: q.questionType,
                        optionA: q.optionA,
                        optionB: q.optionB,
                        optionC: q.optionC,
                        optionD: q.optionD,
                        optionE: q.optionE,
                        correctOption: q.correctOption,
                        difficulty: q.difficulty,
                        isActive: true,
                    }
                })
                successCount++
                console.log(`✓ 题目 ${q.questionNo}: ${q.word || q.questionText?.substring(0, 20)}`)
            } catch (err: any) {
                console.error(`✗ 题目 ${q.questionNo} 导入失败:`, err.message)
            }
        }

        console.log(`\n导入完成: ${successCount}/${questions.length} 道题目成功`)
    } catch (error) {
        console.error('导入失败:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

importQuizQuestions()
