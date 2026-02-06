/**
 * @file route.ts
 * @desc 词汇量测试流程API - 开始测试和提交结果
 * @see PRD: docs/PRD.md#VocabularyQuiz
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

const QUIZ_QUESTION_COUNT = 50 // 词汇测试题目数量

// POST /api/vocabulary-quiz/start - 开始词汇量测试
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
        const { studentId } = body

        if (!studentId) {
            return apiResponse.error('缺少studentId参数', 400)
        }

        // 修复：使用正确的表 vocabulary_quiz_questions 而不是 questions
        const quizQuestions = await prisma.vocabulary_quiz_questions.findMany({
            where: {
                isActive: true
            },
            orderBy: { questionNo: 'asc' },
            take: QUIZ_QUESTION_COUNT * 2 // 多取一些用于随机筛选
        })

        if (quizQuestions.length === 0) {
            return apiResponse.error('暂无可用题目', 400)
        }

        // 随机选择指定数量的题目
        const shuffled = quizQuestions
            .map(q => ({ ...q, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .slice(0, Math.min(QUIZ_QUESTION_COUNT, quizQuestions.length))

        // 转换为前端需要的格式
        const formattedQuestions = shuffled.map((q, index) => {
            // 调试：打印第一题的原始数据
            if (index === 0) {
                console.log('[词汇量测试] 第一题原始数据:', JSON.stringify({
                    id: q.id,
                    questionNo: q.questionNo,
                    word: q.word,
                    questionText: q.questionText,
                    optionA: q.optionA,
                    optionB: q.optionB,
                    optionC: q.optionC,
                    optionD: q.optionD,
                    correctOption: q.correctOption
                }, null, 2))
            }

            return {
                id: q.id,
                questionNo: index + 1,
                word: q.word || '',
                questionText: q.questionText || '',
                questionType: q.questionType,
                options: [q.optionA, q.optionB, q.optionC, q.optionD],
                correctOption: q.correctOption,
                difficulty: q.difficulty
            }
        })

        return apiResponse.success({
            questions: formattedQuestions,
            totalQuestions: formattedQuestions.length,
        })
    } catch (error: any) {
        console.error('开始测试失败:', error)
        return apiResponse.error(`开始测试失败: ${error?.message || '未知错误'}`)
    }
}
