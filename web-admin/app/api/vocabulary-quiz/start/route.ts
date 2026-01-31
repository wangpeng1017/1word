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

        // 获取有音频的词汇题目（用于词汇测试）
        const questionsWithAudio = await prisma.questions.findMany({
            where: {
                isActive: true,
                vocabulary: {
                    word_audios: {
                        some: {} // 确保词汇有音频
                    }
                }
            },
            include: {
                vocabulary: {
                    select: {
                        word: true,
                        primaryMeaning: true,
                        word_audios: {
                            take: 1,
                            where: {
                                accent: 'US'
                            }
                        }
                    }
                },
                question_options: {
                    orderBy: { order: 'asc' }
                }
            },
            take: QUIZ_QUESTION_COUNT * 3 // 多取一些用于随机筛选
        })

        if (questionsWithAudio.length === 0) {
            return apiResponse.error('暂无可用题目', 400)
        }

        // 随机选择指定数量的题目
        const shuffled = questionsWithAudio
            .map(q => ({ ...q, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .slice(0, QUIZ_QUESTION_COUNT)

        // 转换为前端需要的格式
        const quizQuestions = shuffled.map((q, index) => {
            // 生成选项 A, B, C, D, E
            const options = q.question_options.map(opt => opt.content).slice(0, 4)
            while (options.length < 4) options.push('')

            // 找到正确答案的位置
            const correctOption = q.question_options.find(o => o.isCorrect)
            const correctIndex = correctOption ? q.question_options.indexOf(correctOption) : 0
            const correctLetter = ['A', 'B', 'C', 'D'][correctIndex] || 'A'

            return {
                id: q.id,
                questionNo: index + 1,
                word: q.vocabulary.word,
                meaning: q.vocabulary.primaryMeaning,
                options,
                correctOption: correctLetter,
                type: q.type
            }
        })

        return apiResponse.success({
            questions: quizQuestions,
            totalQuestions: quizQuestions.length,
        })
    } catch (error: any) {
        console.error('开始测试失败:', error)
        return apiResponse.error(`开始测试失败: ${error?.message || '未知错误'}`)
    }
}
