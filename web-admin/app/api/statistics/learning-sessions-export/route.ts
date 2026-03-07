import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * @file learning-sessions-export/route.ts
 * @desc 学习数据全量导出 API，供前端直接生成 Excel，不受分页限制（最多 5000 条）
 * @see PRD: docs/statistics/PRD.md#学习数据列表
 */

// 全量导出最大条数限制，保护生产环境稳定性
const MAX_EXPORT_ROWS = 5000

/**
 * 全量导出学习会话列表（不分页）
 * GET /api/statistics/learning-sessions-export
 * 参数与 /api/statistics/learning-sessions 完全一致，去掉 page/pageSize
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = getTokenFromHeader(authHeader || '')

        const payload = verifyToken(token || '')
        if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
            return unauthorizedResponse('只有教师或管理员可以导出学习数据')
        }

        const { searchParams } = new URL(request.url)
        const classId = searchParams.get('classId')
        const studentId = searchParams.get('studentId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const studentName = searchParams.get('studentName')
        const studyType = searchParams.get('studyType')

        // 构建学生筛选条件（与分页接口完全一致）
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

        // 构建日期筛选条件（与分页接口完全一致）
        const dateFilter: any = {}
        if (startDate) {
            dateFilter.gte = new Date(startDate)
        }
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            dateFilter.lte = end
        }

        // 构建学习类型筛选条件（与分页接口完全一致）
        const typeFilter: any = {}
        if (studyType === '新学') {
            typeFilter.AND = [
                { isRetestMode: false },
                {
                    OR: [
                        { status: 'COMPLETED_NEW', id: { contains: '_dnull' } },
                        { id: { contains: '_mnew_' } },
                        { id: { contains: '_munknown_dnull' } },
                        { id: { contains: '_mall_dnull' } },
                    ]
                },
            ]
        } else if (studyType === '复习') {
            typeFilter.OR = [
                { status: 'COMPLETED_REVIEW' },
                { id: { contains: '_mreview_' } },
            ]
        } else if (studyType === '错题') {
            typeFilter.isRetestMode = true
        }

        // 查询全量数据（最多 MAX_EXPORT_ROWS 条）
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
                        classes: {
                            select: {
                                name: true,
                                plan_classes: { where: { status: 'ACTIVE' }, select: { start_date: true }, take: 1 }
                            }
                        },
                    },
                },
            },
            orderBy: [
                { taskDate: 'desc' },
                { startedAt: 'desc' },
            ],
            take: MAX_EXPORT_ROWS + 1, // 多取 1 条用于判断是否超限
        })

        // 判断是否超出上限
        const truncated = records.length > MAX_EXPORT_ROWS
        const trimmedRecords = truncated ? records.slice(0, MAX_EXPORT_ROWS) : records

        // 格式化数据（与分页接口逻辑完全一致）
        const sessions = trimmedRecords.map((record) => {
            const completionRate = record.totalWords > 0
                ? ((record.completedWords / record.totalWords) * 100).toFixed(1)
                : '0.0'

            const totalAnswered = record.correctCount + record.wrongCount
            const accuracy = totalAnswered > 0
                ? ((record.correctCount / totalAnswered) * 100).toFixed(1)
                : '0.0'

            // 推断学习类型（与分页接口逻辑完全一致）
            const recordStatus = (record as any).status || ''
            let inferredStudyType = '未知'
            if (record.isRetestMode) {
                inferredStudyType = '错题'
            } else if (recordStatus === 'COMPLETED_NEW') {
                const dayMatch = record.id.match(/_d(\d+)_/)
                inferredStudyType = (dayMatch && dayMatch[1] !== 'null') ? `补卡(Day${dayMatch[1]})` : '新学'
            } else if (recordStatus === 'COMPLETED_REVIEW') {
                const dayMatch = record.id.match(/_d(\d+)_/)
                inferredStudyType = dayMatch ? `复习(Day${dayMatch[1]})` : '复习'
            } else {
                const modeMatch = record.id.match(/_m(new|review|unknown|all|retest)(?:_|$)/)
                const dayMatch = record.id.match(/_d(\d+)_/)
                const idMode = modeMatch ? modeMatch[1] : ''
                if (idMode === 'new' || idMode === 'unknown' || idMode === 'all') {
                    inferredStudyType = (dayMatch && dayMatch[1] !== 'null') ? `补卡(Day${dayMatch[1]})` : '新学'
                } else if (idMode === 'review') {
                    inferredStudyType = dayMatch ? `复习(Day${dayMatch[1]})` : '复习'
                } else if (idMode === 'retest') {
                    inferredStudyType = '错题'
                } else {
                    inferredStudyType = '新学'
                }
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
                studyType: inferredStudyType,
            }

            // 补卡记录：用计划开始日期+dayNumber计算原始任务日期
            if (inferredStudyType.startsWith('补卡(Day')) {
                const dayMatch = inferredStudyType.match(/Day(\d+)/)
                const planClass = (record.students.classes as any).plan_classes?.[0]
                if (dayMatch && planClass?.start_date) {
                    const scheduledDate = new Date(planClass.start_date)
                    scheduledDate.setDate(scheduledDate.getDate() + parseInt(dayMatch[1]) - 1)
                    session.taskDate = scheduledDate.toISOString().split('T')[0]
                }
            }

            // 非完成状态的记录，completedAt 应该为空
            if (session.status !== 'COMPLETED' && session.status !== 'COMPLETED_NEW' && session.status !== 'COMPLETED_REVIEW') {
                session.completedAt = null
            }

            return session
        })

        return successResponse({
            sessions,
            total: sessions.length,
            truncated,
            maxRows: MAX_EXPORT_ROWS,
        })
    } catch (error) {
        console.error('全量导出学习数据错误:', error)
        return errorResponse('导出学习数据失败', 500)
    }
}
