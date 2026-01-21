/**
 * @file route.ts
 * @desc 词汇量测试流程API - 开始测试和提交结果
 * @see PRD: docs/PRD.md#VocabularyQuiz
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

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

        // 获取所有启用的题目
        const allQuestions = await prisma.vocabulary_quiz_questions.findMany({
            where: { isActive: true },
            orderBy: { questionNo: 'asc' },
        })

        if (allQuestions.length === 0) {
            return apiResponse.error('暂无可用题目', 400)
        }

        // 随机打乱顺序返回
        const shuffledQuestions = allQuestions
            .map(q => ({ ...q, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ sort, ...q }) => q)

        return apiResponse.success({
            questions: shuffledQuestions,
            totalQuestions: shuffledQuestions.length,
        })
    } catch (error: any) {
        console.error('开始测试失败:', error)
        return apiResponse.error(`开始测试失败: ${error?.message || '未知错误'}`)
    }
}
