/**
 * @file route.ts
 * @desc 词汇量测试提交API - 提交测试结果并计算词汇量
 * @see PRD: docs/PRD.md#VocabularyQuiz
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

interface AnswerRecord {
    questionId: string
    userAnswer: string  // A/B/C/D/E
    isCorrect: boolean
    timeSpent?: number
}

// POST /api/vocabulary-quiz/submit - 提交测试结果
export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromHeader(request.headers.get('authorization'))
        if (!token) {
            return apiResponse.unauthorized('未授权')
        }

        const payload = verifyToken(token)
        if (!payload) {
            return apiResponse.unauthorized('Token无效')
        }

        const body = await request.json()
        const { studentId, answers, startedAt, completedAt } = body

        if (!studentId || !answers || !Array.isArray(answers)) {
            return apiResponse.error('参数错误', 400)
        }

        // 统计答题情况
        const totalQuestions = answers.length
        const correctCount = answers.filter((a: AnswerRecord) => a.isCorrect).length
        const wrongCount = totalQuestions - correctCount
        const unknownCount = answers.filter((a: AnswerRecord) => a.userAnswer === 'E').length
        const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0

        // 计算估算词汇量（50题对应2000词）
        const vocabPerQuestion = 2000 / 50  // 每题代表40词
        const estimatedVocab = Math.round(correctCount * vocabPerQuestion)

        // 计算用时
        const startTime = new Date(startedAt).getTime()
        const endTime = new Date(completedAt).getTime()
        const totalTime = Math.floor((endTime - startTime) / 1000)

        // 创建测试记录
        const recordId = `vqr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

        const record = await prisma.vocabulary_quiz_records.create({
            data: {
                id: recordId,
                studentId,
                totalQuestions,
                correctCount,
                wrongCount,
                unknownCount,
                estimatedVocab,
                accuracy,
                totalTime,
                startedAt: new Date(startedAt),
                completedAt: new Date(completedAt),
                isCompleted: true,
            }
        })

        // 创建答题详情记录
        const answerRecords = answers.map((a: AnswerRecord, index: number) => ({
            id: `vqa_${recordId}_${index}`,
            recordId,
            questionId: a.questionId,
            userAnswer: a.userAnswer,
            isCorrect: a.isCorrect,
            timeSpent: a.timeSpent || null,
        }))

        await prisma.vocabulary_quiz_answers.createMany({
            data: answerRecords,
        })

        return apiResponse.success({
            message: '测试提交成功',
            stats: {
                totalQuestions,
                correctCount,
                wrongCount,
                unknownCount,
                accuracy: accuracy.toFixed(1),
                estimatedVocab,
                totalTime,
            },
        })
    } catch (error: any) {
        console.error('提交测试失败:', error)
        return apiResponse.error(`提交测试失败: ${error?.message || '未知错误'}`)
    }
}
