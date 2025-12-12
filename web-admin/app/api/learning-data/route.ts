import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { detectInterruptedTasks } from '@/lib/task-interrupt-detector'

/**
 * 获取学习数据列表（基于 daily_tasks 聚合）
 * GET /api/learning-data?classId=xxx&studentId=xxx&startDate=xxx&endDate=xxx&status=xxx
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

        // 筛选条件
        const classId = searchParams.get('classId')
        const studentId = searchParams.get('studentId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const status = searchParams.get('status') // PENDING, IN_PROGRESS, COMPLETED, INTERRUPTED

        // 先检测中断的任务
        await detectInterruptedTasks(studentId || undefined)

        // 构建查询条件
        const where: any = {}

        if (studentId) {
            where.studentId = studentId
        } else if (classId) {
            where.students = {
                class_id: classId,
            }
        }

        if (startDate || endDate) {
            where.taskDate = {}
            if (startDate) {
                where.taskDate.gte = new Date(startDate)
            }
            if (endDate) {
                where.taskDate.lte = new Date(endDate + 'T23:59:59')
            }
        }

        if (status) {
            where.status = status
        }

        // 按学生和日期分组查询
        const groupedData = await prisma.$queryRaw`
            SELECT
                dt."studentId",
                dt."taskDate",
                s."class_id" as "classId",
                COUNT(*) as "totalTasks",
                COUNT(CASE WHEN dt.status = 'COMPLETED' THEN 1 END) as "completedTasks",
                COUNT(CASE WHEN dt.status = 'IN_PROGRESS' THEN 1 END) as "inProgressTasks",
                COUNT(CASE WHEN dt.status = 'INTERRUPTED' THEN 1 END) as "interruptedTasks",
                COUNT(CASE WHEN dt.status = 'PENDING' THEN 1 END) as "pendingTasks",
                MIN(dt."startedAt") as "startedAt",
                MAX(dt."completedAt") as "completedAt",
                MAX(dt."updatedAt") as "lastUpdatedAt"
            FROM daily_tasks dt
            LEFT JOIN students s ON dt."studentId" = s.id
            WHERE 1=1
            ${studentId ? prisma.$queryRaw`AND dt."studentId" = ${studentId}` : prisma.$queryRaw``}
            ${classId ? prisma.$queryRaw`AND s."class_id" = ${classId}` : prisma.$queryRaw``}
            ${startDate ? prisma.$queryRaw`AND dt."taskDate" >= ${new Date(startDate)}` : prisma.$queryRaw``}
            ${endDate ? prisma.$queryRaw`AND dt."taskDate" <= ${new Date(endDate + 'T23:59:59')}` : prisma.$queryRaw``}
            GROUP BY dt."studentId", dt."taskDate", s."class_id"
            ORDER BY dt."taskDate" DESC, "lastUpdatedAt" DESC
            LIMIT ${limit} OFFSET ${skip}
        ` as any[]

        // 获取学生和班级信息
        const studentIds = [...new Set(groupedData.map((d: any) => d.studentId))]
        const students = await prisma.students.findMany({
            where: { id: { in: studentIds } },
            include: {
                user: { select: { name: true } },
                classes: { select: { name: true } }
            }
        })
        const studentMap = new Map(students.map(s => [s.id, s]))

        // 获取答题记录统计
        const answerStats = await prisma.question_answers.groupBy({
            by: ['studentId'],
            where: {
                studentId: { in: studentIds }
            },
            _count: {
                isCorrect: true
            },
            _sum: {
                // 暂时无法直接统计，需要另外查询
            }
        })

        // 格式化数据
        const formattedRecords = groupedData.map((record: any) => {
            const student = studentMap.get(record.studentId)
            const totalTasks = Number(record.totalTasks)
            const completedTasks = Number(record.completedTasks)
            const interruptedTasks = Number(record.interruptedTasks)
            const inProgressTasks = Number(record.inProgressTasks)
            const pendingTasks = Number(record.pendingTasks)

            // 计算状态
            let displayStatus: string
            if (completedTasks === totalTasks) {
                displayStatus = 'COMPLETED'
            } else if (interruptedTasks > 0) {
                displayStatus = 'INTERRUPTED'
            } else if (inProgressTasks > 0) {
                displayStatus = 'IN_PROGRESS'
            } else {
                displayStatus = 'PENDING'
            }

            return {
                id: `${record.studentId}_${record.taskDate}`,
                studentId: record.studentId,
                studentName: student?.user?.name || '未知',
                className: student?.classes?.name || '未分配',
                taskDate: record.taskDate,
                totalWords: totalTasks,
                completedWords: completedTasks,
                interruptedWords: interruptedTasks,
                inProgressWords: inProgressTasks,
                pendingWords: pendingTasks,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                startedAt: record.startedAt,
                completedAt: record.completedAt,
                status: displayStatus,
            }
        })

        // 如果有状态筛选，过滤结果
        const filteredRecords = status
            ? formattedRecords.filter((r: any) => r.status === status)
            : formattedRecords

        // 获取总数（简化处理，实际应该用更精确的查询）
        const totalCount = await prisma.daily_tasks.groupBy({
            by: ['studentId', 'taskDate'],
            where,
        })

        return successResponse({
            records: filteredRecords,
            pagination: {
                page,
                limit,
                total: totalCount.length,
                totalPages: Math.ceil(totalCount.length / limit),
            },
        })
    } catch (error) {
        console.error('获取学习数据错误:', error)

        // 如果原生查询失败，回退到简单查询
        try {
            return await getFallbackLearningData(request)
        } catch (fallbackError) {
            console.error('回退查询也失败:', fallbackError)
            return errorResponse('获取学习数据失败', 500)
        }
    }
}

/**
 * 回退查询方式（不使用原生SQL）
 */
async function getFallbackLearningData(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    const where: any = {}
    if (studentId) where.studentId = studentId
    if (startDate || endDate) {
        where.taskDate = {}
        if (startDate) where.taskDate.gte = new Date(startDate)
        if (endDate) where.taskDate.lte = new Date(endDate + 'T23:59:59')
    }
    if (status) where.status = status

    const [tasks, total] = await Promise.all([
        prisma.daily_tasks.findMany({
            where,
            skip,
            take: limit,
            orderBy: [
                { taskDate: 'desc' },
                { updatedAt: 'desc' }
            ],
            include: {
                students: {
                    include: {
                        user: { select: { name: true } },
                        classes: { select: { name: true } }
                    }
                },
                vocabularies: {
                    select: { word: true }
                }
            }
        }),
        prisma.daily_tasks.count({ where })
    ])

    const formattedRecords = tasks.map(task => ({
        id: task.id,
        studentId: task.studentId,
        studentName: task.students?.user?.name || '未知',
        className: task.students?.classes?.name || '未分配',
        taskDate: task.taskDate,
        word: task.vocabularies?.word || '',
        totalWords: 1,
        completedWords: task.status === 'COMPLETED' ? 1 : 0,
        interruptedWords: task.status === 'INTERRUPTED' ? 1 : 0,
        completionRate: task.status === 'COMPLETED' ? 100 : 0,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        status: task.status,
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
}
