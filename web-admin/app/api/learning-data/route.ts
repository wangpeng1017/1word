import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * 获取学习数据列表
 * GET /api/learning-data
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = getTokenFromHeader(authHeader || '')

        const payload = verifyToken(token || '')
        if (!payload || payload.role !== 'TEACHER') {
            return unauthorizedResponse('只有教师可以查看学习数据')
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
        const skip = (page - 1) * limit

        const [records, total] = await Promise.all([
            prisma.study_records.findMany({
                skip,
                take: limit,
                orderBy: [
                    { completedAt: 'desc' },
                    { updatedAt: 'desc' },
                ],
                include: {
                    students: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                            classes: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.study_records.count(),
        ])

        // 格式化数据
        const formattedRecords = records.map((record: any) => ({
            id: record.id,
            studentId: record.studentId,
            studentName: record.students?.user?.name || '未知',
            className: record.students?.classes?.name || '未分配',
            taskDate: record.taskDate,
            totalWords: record.totalWords,
            completedWords: record.completedWords,
            completionRate: record.totalWords > 0
                ? Math.round((record.completedWords / record.totalWords) * 100)
                : 0,
            correctCount: record.correctCount,
            wrongCount: record.wrongCount,
            accuracy: Math.round(record.accuracy * 100), // 转为百分比整数 (0-100)
            totalTime: record.totalTime, // 秒
            startedAt: record.startedAt,
            completedAt: record.completedAt,
            isCompleted: record.isCompleted,
            createdAt: record.createdAt,
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
        console.error('获取学习数据错误:', error)
        return errorResponse('获取学习数据失败', 500)
    }
}
