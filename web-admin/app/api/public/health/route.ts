import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'

/**
 * 数据库健康检查
 * GET /api/public/health
 */
export async function GET(request: NextRequest) {
    const debug: any = {
        timestamp: new Date().toISOString(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL_SET: !!process.env.DATABASE_URL,
            // 这里的 DATABASE_URL 在生产中不要打印，或者只打印脱敏后的
            DATABASE_URL: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')
        }
    }

    try {
        debug.db_connection = 'trying...'
        const count = await prisma.user.count()
        debug.db_connection = 'ok'
        debug.user_count = count

        return successResponse(debug, '数据库连接正常')
    } catch (error: any) {
        debug.db_connection = 'failed'
        debug.error = {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack?.split('\n').slice(0, 5) // 只取前几行
        }

        // 如果是 Prisma 错误，尝试检查客户端是否已加载
        try {
            debug.prisma_engines = 'checking...'
            // @ts-ignore
            debug.active_provider = prisma._activeProvider
        } catch { }

        return errorResponse(debug, 500)
    }
}
