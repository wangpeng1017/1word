import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { MODULE_NAMES, ACTION_NAMES } from '@/lib/log'

/**
 * 获取操作日志列表
 */
export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromHeader(request.headers.get('Authorization'))
        if (!token) {
            return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
        }

        const payload = verifyToken(token)
        if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
        }

        // 解析查询参数
        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '20')
        const userId = searchParams.get('userId')
        const action = searchParams.get('action')
        const module = searchParams.get('module')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // 构建查询条件
        const where: any = {}

        if (userId) {
            where.userId = userId
        }

        if (action) {
            where.action = action
        }

        if (module) {
            where.module = module
        }

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                where.createdAt.gte = new Date(startDate)
            }
            if (endDate) {
                // 设置为当天结束时间
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                where.createdAt.lte = end
            }
        }

        // 查询日志列表
        const [logs, total] = await Promise.all([
            prisma.operation_logs.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.operation_logs.count({ where }),
        ])

        // 格式化日志数据
        const formattedLogs = logs.map((log) => ({
            ...log,
            moduleName: MODULE_NAMES[log.module] || log.module,
            actionName: ACTION_NAMES[log.action] || log.action,
        }))

        return NextResponse.json({
            success: true,
            data: {
                list: formattedLogs,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        })
    } catch (error) {
        console.error('获取操作日志失败:', error)
        return NextResponse.json({ success: false, error: '获取操作日志失败' }, { status: 500 })
    }
}
