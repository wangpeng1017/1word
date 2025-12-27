import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * @file learning-sessions/route.ts
 * @desc 学习数据列表 API，支持分页查询和多条件筛选
 * @see PRD: docs/statistics/PRD.md#学习数据列表
 */

// 默认中断超时时间（分钟）
const DEFAULT_INTERRUPT_TIMEOUT = 10

/**
 * 获取中断超时配置
 */
async function getInterruptTimeout(): Promise<number> {
    try {
        const config = await prisma.system_configs.findUnique({
            where: { key: 'studyConfig' }
        })
        if (config?.value) {
            const parsed = JSON.parse(config.value)
            return parsed.interruptTimeout || DEFAULT_INTERRUPT_TIMEOUT
        }
    } catch (e) {
        console.warn('[TASK] 获取中断超时配置失败，使用默认值', e)
    }
    return DEFAULT_INTERRUPT_TIMEOUT
}

/**
 * 检测并更新中断的学习记录
 */
async function detectAndUpdateInterrupted() {
    const timeoutMinutes = await getInterruptTimeout()
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000)

    // 更新超时的进行中记录为中断状态
    const result = await prisma.study_records.updateMany({
        where: {
            status: 'IN_PROGRESS',
            lastActiveAt: { lt: cutoffTime },
        },
        data: {
            status: 'INTERRUPTED',
            updatedAt: new Date(),
        },
    })

    if (result.count > 0) {
        console.log(`[学习数据] 检测到 ${result.count} 条超时中断的记录（超时: ${timeoutMinutes}分钟）`)
    }
}

/**
 * 获取学习会话列表
 * GET /api/statistics/learning-sessions?classId=xxx&studentId=xxx&startDate=xxx&endDate=xxx&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = getTokenFromHeader(authHeader || '')

        const payload = verifyToken(token || '')
        if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
            return unauthorizedResponse('只有教师或管理员可以查看学习数据')
        }

        // 注意：detectAndUpdateInterrupted 功能暂时禁用
        // 原因：study_records 表缺少 status 和 lastActiveAt 字段
        // 如需启用，需要先执行数据库迁移添加这些字段
        // await detectAndUpdateInterrupted()

        const { searchParams } = new URL(request.url)
        const classId = searchParams.get('classId')
        const studentId = searchParams.get('studentId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1', 10)
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

        // 构建学生筛选条件
        const studentFilter: any = {}
        if (classId) {
            studentFilter.class_id = classId
        }
        if (studentId) {
            studentFilter.id = studentId
        }

        // 构建日期筛选条件
        const dateFilter: any = {}
        if (startDate) {
            dateFilter.gte = new Date(startDate)
        }
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            dateFilter.lte = end
        }

        // 查询总数
        const total = await prisma.study_records.count({
            where: {
                students: Object.keys(studentFilter).length > 0 ? studentFilter : undefined,
                taskDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
            },
        })

        // 查询分页数据
        const records = await prisma.study_records.findMany({
            where: {
                students: Object.keys(studentFilter).length > 0 ? studentFilter : undefined,
                taskDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
            },
            include: {
                students: {
                    include: {
                        user: { select: { name: true } },
                        classes: { select: { name: true } },
                    },
                },
            },
            orderBy: [
                { taskDate: 'desc' },
                { startedAt: 'desc' },
            ],
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

        // 格式化返回数据
        const sessions = records.map((record) => {
            const completionRate = record.totalWords > 0
                ? ((record.completedWords / record.totalWords) * 100).toFixed(1)
                : '0.0'

            const totalAnswered = record.correctCount + record.wrongCount
            const accuracy = totalAnswered > 0
                ? ((record.correctCount / totalAnswered) * 100).toFixed(1)
                : '0.0'

            return {
                id: record.id,
                studentId: record.studentId,
                studentName: record.students.user.name,
                studentNo: record.students.student_no,
                className: record.students.classes.name,
                taskDate: record.taskDate.toISOString().split('T')[0],
                totalWords: record.totalWords,
                completedWords: record.completedWords,
                completionRate,
                correctCount: record.correctCount,
                wrongCount: record.wrongCount,
                accuracy,
                totalTimeSeconds: record.totalTime,
                startedAt: record.startedAt.toISOString(),
                completedAt: record.completedAt?.toISOString() || null,
                isCompleted: record.isCompleted,
                status: (record as any).status || (record.isCompleted ? 'COMPLETED' : 'IN_PROGRESS'),
            }
        })

        return successResponse({
            sessions,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        })
    } catch (error) {
        console.error('获取学习会话列表错误:', error)
        return errorResponse('获取学习数据失败', 500)
    }
}
