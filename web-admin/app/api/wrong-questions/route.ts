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
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
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
                        },
                    },
                },
            }),
            prisma.question_answers.count({ where }),
        ])

        // 格式化数据
        const formattedRecords = records.map((record: any) => ({
            id: record.id,
            studentId: record.studentId,
            studentName: record.students?.user?.name || '未知',
            className: record.students?.classes?.name || '未分配',
            word: record.vocabularies?.word || '',
            meaning: record.vocabularies?.word_meanings?.[0]?.meaning || '',
            questionType: record.questions?.type || '',
            questionContent: record.questions?.content || '',
            wrongAnswer: record.answer, // question_answers 表中是 answer 字段
            correctAnswer: record.questions?.correctAnswer || '',
            wrongAt: record.answeredAt, // 改用 answeredAt
        }))

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
