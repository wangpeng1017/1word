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

        // 检测并更新超时中断的学习记录
        await detectAndUpdateInterrupted()

        const { searchParams } = new URL(request.url)
        const classId = searchParams.get('classId')
        const studentId = searchParams.get('studentId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1', 10)
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
        const studentName = searchParams.get('studentName')

        // 构建学生筛选条件
        const studentFilter: any = {}
        if (classId) {
            studentFilter.class_id = classId
        }
        if (studentId) {
            studentFilter.id = studentId
        }
        if (studentName) {
            studentFilter.user = { name: { contains: studentName } }
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

        // 构建学习类型筛选条件
        const studyType = searchParams.get('studyType')
        const typeFilter: any = {}
        if (studyType === '新学') {
            typeFilter.OR = [
                { status: 'COMPLETED_NEW' },
                { id: { contains: '_mnew_' } },
            ]
        } else if (studyType === '复习') {
            typeFilter.OR = [
                { status: 'COMPLETED_REVIEW' },
                { id: { contains: '_mreview_' } },
            ]
        } else if (studyType === '错题') {
            typeFilter.isRetestMode = true
        }

        // 查询总数
        const total = await prisma.study_records.count({
            where: {
                students: Object.keys(studentFilter).length > 0 ? studentFilter : undefined,
                taskDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
                ...typeFilter,
            },
        })

        // 查询分页数据
        const records = await prisma.study_records.findMany({
            where: {
                students: Object.keys(studentFilter).length > 0 ? studentFilter : undefined,
                taskDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
                ...typeFilter,
            },
            include: {
                students: {
                    include: {
                        user: { select: { name: true, phone: true } },
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

            // 推断学习类型
            const recordStatus = (record as any).status || ''
            let studyType = '未知'
            if (record.isRetestMode) {
                studyType = '错题'
            } else if (recordStatus === 'COMPLETED_NEW') {
                const dayMatch = record.id.match(/_d(\d+)/)
                studyType = (dayMatch && dayMatch[1] !== 'null') ? `补卡(Day${dayMatch[1]})` : '新学'
            } else if (recordStatus === 'COMPLETED_REVIEW') {
                // 尝试从 sessionId 中提取 day 编号
                const dayMatch = record.id.match(/_d(\d+)/)
                studyType = dayMatch ? `复习(Day${dayMatch[1]})` : '复习'
            } else {
                // 从 sessionId 解析 mode/day 兜底
                const modeMatch = record.id.match(/_m(\w+)/)
                const dayMatch = record.id.match(/_d(\d+)/)
                const idMode = modeMatch ? modeMatch[1] : ''
                if (idMode === 'new') {
                    studyType = (dayMatch && dayMatch[1] !== 'null') ? `补卡(Day${dayMatch[1]})` : '新学'
                } else if (idMode === 'review') {
                    studyType = dayMatch ? `复习(Day${dayMatch[1]})` : '复习'
                } else if (idMode === 'retest') {
                    studyType = '错题'
                }
                // 其他情况保持"未知"
            }

            const session: any = {
                id: record.id,
                studentId: record.studentId,
                studentName: record.students.user.name,
                phone: record.students.user.phone || '',
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
                studyType,
            }

            // 修复：对于非完成状态的记录，completedAt 应该为空
            // 防止数据库默认值导致的时区偏差（表现为结束时间是未来时间）
            if (session.status !== 'COMPLETED' && session.status !== 'COMPLETED_NEW' && session.status !== 'COMPLETED_REVIEW') {
                session.completedAt = null
            }

            return session
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
