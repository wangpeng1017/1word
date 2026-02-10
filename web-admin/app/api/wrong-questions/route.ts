/**
 * @file 错题明细 API
 * @desc 获取错题明细列表，从question_answers表查询isCorrect=false的记录
 * @input 依赖: prisma, auth, question_answers
 * @output 导出: GET /api/wrong-questions
 * @pos API层 - 学习数据分析模块
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * 获取错题明细列表
 * GET /api/wrong-questions
 * 改用 question_answers 表查询（替代已废弃的 wrong_questions 表）
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = getTokenFromHeader(authHeader || '')

        const payload = verifyToken(token || '')
        if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
            return unauthorizedResponse('只有教师或管理员可以查看错题数据')
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 10000)
        const skip = (page - 1) * limit

        // 筛选条件
        const studentId = searchParams.get('studentId')
        const classId = searchParams.get('classId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // 构建查询条件（使用 question_answers 表，筛选 isCorrect = false）
        const where: any = {
            isCorrect: false, // 只查询错误的答题记录
        }

        if (studentId) {
            where.studentId = studentId
        }

        if (classId) {
            where.students = {
                class_id: classId,
            }
        }

        if (startDate || endDate) {
            where.answeredAt = {}
            if (startDate) {
                where.answeredAt.gte = new Date(startDate)
            }
            if (endDate) {
                where.answeredAt.lte = new Date(endDate + 'T23:59:59')
            }
        }

        const [records, total] = await Promise.all([
            prisma.question_answers.findMany({
                where,
                skip,
                take: limit,
                orderBy: { answeredAt: 'desc' },
                include: {
                    students: {
                        include: {
                            user: { select: { name: true } },
                            classes: { select: { name: true } },
                        },
                    },
                    vocabularies: {
                        select: {
                            word: true,
                            word_meanings: {
                                orderBy: { orderIndex: 'asc' },
                                take: 1,
                                select: { meaning: true },
                            },
                        },
                    },
                    questions: {
                        select: {
                            type: true,
                            content: true,
                            correctAnswer: true,
                            question_options: {
                                orderBy: { order: 'asc' },
                                select: {
                                    content: true,
                                    order: true,
                                    isCorrect: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.question_answers.count({ where }),
        ])

        // 格式化数据
        const formattedRecords = records.map((record: any) => {
            const options = record.questions?.question_options || []
            const wrongAnswerLetter = record.answer // 用户选择的选项字母（洗牌后的位置）

            // ⚠️ 重要：用户的 answer 是前端洗牌后的位置标签（A/B/C/D），
            // 无法用原始选项顺序映射回实际内容。
            // 正确答案通过 isCorrect 标记精确查找。
            const correctOption = options.find((o: any) => o.isCorrect)
            const correctAnswerContent = correctOption?.content || record.questions?.correctAnswer || '-'

            // 用户答案：优先使用存储的实际选项内容，老数据（仅位置标签）回退为提示文字
            const rawAnswer = record.answer || ''
            const isOnlyLabel = /^[A-Da-d]$/.test(rawAnswer.trim())
            const wrongAnswerContent = (rawAnswer && !isOnlyLabel) ? rawAnswer : `选项${rawAnswer || '?'}（已打乱顺序）`

            return {
                id: record.id,
                studentId: record.studentId,
                studentName: record.students?.user?.name || '未知',
                className: record.students?.classes?.name || '未分配',
                word: record.vocabularies?.word || '',
                meaning: record.vocabularies?.word_meanings?.[0]?.meaning || '',
                questionType: record.questions?.type || '',
                questionContent: record.questions?.content || '',
                wrongAnswer: wrongAnswerContent,
                correctAnswer: correctAnswerContent,
                wrongAt: record.answeredAt,
            }
        })

        return successResponse({
            records: formattedRecords,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('获取错题明细错误:', error)
        return errorResponse('获取错题明细失败', 500)
    }
}
