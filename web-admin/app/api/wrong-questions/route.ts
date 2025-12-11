import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * 获取错题明细列表
 * GET /api/wrong-questions
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = getTokenFromHeader(authHeader || '')

        const payload = verifyToken(token || '')
        if (!payload || payload.role !== 'TEACHER') {
            return unauthorizedResponse('只有教师可以查看错题数据')
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

        // 构建查询条件
        const where: any = {}

        if (studentId) {
            where.studentId = studentId
        }

        if (classId) {
            where.students = {
                class_id: classId,
            }
        }

        if (startDate || endDate) {
            where.wrongAt = {}
            if (startDate) {
                where.wrongAt.gte = new Date(startDate)
            }
            if (endDate) {
                where.wrongAt.lte = new Date(endDate + 'T23:59:59')
            }
        }

        const [records, total] = await Promise.all([
            prisma.wrong_questions.findMany({
                where,
                skip,
                take: limit,
                orderBy: { wrongAt: 'desc' },
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
                            primary_meaning: true,
                        },
                    },
                    questions: {
                        select: {
                            type: true,
                            content: true,
                        },
                    },
                },
            }),
            prisma.wrong_questions.count({ where }),
        ])

        // 格式化数据
        const formattedRecords = records.map((record: any) => ({
            id: record.id,
            studentId: record.studentId,
            studentName: record.students?.user?.name || '未知',
            className: record.students?.classes?.name || '未分配',
            word: record.vocabularies?.word || '',
            meaning: record.vocabularies?.primary_meaning || '',
            questionType: record.questions?.type || '',
            questionContent: record.questions?.content || '',
            wrongAnswer: record.wrongAnswer,
            correctAnswer: record.correctAnswer,
            wrongAt: record.wrongAt,
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
