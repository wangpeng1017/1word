/**
 * @file route.ts
 * @desc 词汇量测试题目API - 单题操作（获取、编辑、删除）
 * @see PRD: docs/PRD.md#VocabularyQuiz
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/vocabulary-quiz-questions/[id] - 获取单个题目
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromHeader(request.headers.get('authorization'))
        if (!token) {
            return apiResponse.unauthorized('未授权')
        }

        const payload = verifyToken(token)
        if (!payload) {
            return apiResponse.unauthorized('Token无效')
        }

        const question = await prisma.vocabulary_quiz_questions.findUnique({
            where: { id: params.id },
        })

        if (!question) {
            return apiResponse.error('题目不存在', 404)
        }

        return apiResponse.success(question)
    } catch (error: any) {
        console.error('获取题目失败:', error)
        return apiResponse.error(`获取题目失败: ${error?.message || '未知错误'}`)
    }
}

// PUT /api/vocabulary-quiz-questions/[id] - 编辑题目
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        const {
            word,
            questionText,
            questionType,
            optionA,
            optionB,
            optionC,
            optionD,
            optionE,
            correctOption,
            difficulty,
            isActive,
        } = body

        const question = await prisma.vocabulary_quiz_questions.update({
            where: { id: params.id },
            data: {
                ...(word !== undefined && { word }),
                ...(questionText !== undefined && { questionText }),
                ...(questionType !== undefined && { questionType }),
                ...(optionA !== undefined && { optionA }),
                ...(optionB !== undefined && { optionB }),
                ...(optionC !== undefined && { optionC }),
                ...(optionD !== undefined && { optionD }),
                ...(optionE !== undefined && { optionE }),
                ...(correctOption !== undefined && { correctOption }),
                ...(difficulty !== undefined && { difficulty }),
                ...(isActive !== undefined && { isActive }),
            },
        })

        return apiResponse.success({
            message: '题目更新成功',
            question,
        })
    } catch (error: any) {
        console.error('更新题目失败:', error)
        return apiResponse.error(`更新题目失败: ${error?.message || '未知错误'}`)
    }
}

// DELETE /api/vocabulary-quiz-questions/[id] - 删除题目
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromHeader(request.headers.get('authorization'))
        if (!token) {
            return apiResponse.unauthorized('未授权')
        }

        const payload = verifyToken(token)
        if (!payload) {
            return apiResponse.unauthorized('Token无效')
        }

        await prisma.vocabulary_quiz_questions.delete({
            where: { id: params.id },
        })

        return apiResponse.success({
            message: '题目删除成功',
        })
    } catch (error: any) {
        console.error('删除题目失败:', error)
        return apiResponse.error(`删除题目失败: ${error?.message || '未知错误'}`)
    }
}
