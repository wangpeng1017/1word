/**
 * @file route.ts
 * @desc 词汇量测试题目API - 列表和新增
 * @see PRD: docs/PRD.md#VocabularyQuiz
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/vocabulary-quiz-questions - 获取题目列表
export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromHeader(request.headers.get('authorization'))
        if (!token) {
            return apiResponse.unauthorized('未授权')
        }

        const payload = verifyToken(token)
        if (!payload) {
            return apiResponse.unauthorized('Token无效')
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const search = searchParams.get('search') || ''
        const questionType = searchParams.get('questionType') || ''
        const isActive = searchParams.get('isActive')

        const where: any = {}

        if (search) {
            where.OR = [
                { word: { contains: search } },
                { questionText: { contains: search } },
            ]
        }

        if (questionType) {
            where.questionType = questionType
        }

        if (isActive !== null && isActive !== '') {
            where.isActive = isActive === 'true'
        }

        const [questions, total] = await Promise.all([
            prisma.vocabulary_quiz_questions.findMany({
                where,
                orderBy: { questionNo: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.vocabulary_quiz_questions.count({ where }),
        ])

        return apiResponse.success({
            questions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error: any) {
        console.error('获取题目列表失败:', error)
        return apiResponse.error(`获取题目列表失败: ${error?.message || '未知错误'}`)
    }
}

// POST /api/vocabulary-quiz-questions - 新增题目
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
        const {
            questionNo,
            word,
            questionText,
            questionType = 'ENGLISH_TO_CHINESE',
            optionA,
            optionB,
            optionC,
            optionD = '以上都不对',
            optionE = '不认识',
            correctOption,
            difficulty = 1,
        } = body

        // 验证必填字段
        if (!optionA || !optionB || !optionC || !correctOption) {
            return apiResponse.error('参数错误：选项和正确答案为必填项', 400)
        }

        // 获取最大题号
        const maxQuestion = await prisma.vocabulary_quiz_questions.findFirst({
            orderBy: { questionNo: 'desc' },
            select: { questionNo: true },
        })
        const newQuestionNo = questionNo || (maxQuestion?.questionNo || 0) + 1

        const question = await prisma.vocabulary_quiz_questions.create({
            data: {
                id: `vqq_${newQuestionNo}_${Date.now()}`,
                questionNo: newQuestionNo,
                word: word || null,
                questionText: questionText || null,
                questionType,
                optionA,
                optionB,
                optionC,
                optionD,
                optionE,
                correctOption,
                difficulty,
                isActive: true,
            }
        })

        return apiResponse.success({
            message: '题目创建成功',
            question,
        })
    } catch (error: any) {
        console.error('创建题目失败:', error)
        return apiResponse.error(`创建题目失败: ${error?.message || '未知错误'}`)
    }
}
