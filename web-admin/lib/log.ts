import { prisma } from './prisma'

/**
 * 操作日志参数
 */
interface LogParams {
    userId: string
    userName: string
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'
    module: string
    target?: string
    targetId?: string
    detail?: Record<string, any>
    ip?: string
    userAgent?: string
}

/**
 * 记录操作日志
 */
export async function recordLog(params: LogParams): Promise<void> {
    try {
        await prisma.operation_logs.create({
            data: {
                userId: params.userId,
                userName: params.userName,
                action: params.action,
                module: params.module,
                target: params.target,
                targetId: params.targetId,
                detail: params.detail || undefined,
                ip: params.ip,
                userAgent: params.userAgent,
            },
        })
    } catch (error) {
        console.error('记录操作日志失败:', error)
    }
}

/**
 * 从请求中提取客户端信息
 */
export function getClientInfo(request: Request): { ip: string; userAgent: string } {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    return { ip, userAgent }
}

/**
 * 模块名称映射（用于日志显示）
 */
export const MODULE_NAMES: Record<string, string> = {
    accounts: '账号管理',
    students: '学生管理',
    classes: '班级管理',
    vocabularies: '词汇管理',
    questions: '题目管理',
    settings: '系统设置',
    auth: '认证',
}

/**
 * 操作类型映射（用于日志显示）
 */
export const ACTION_NAMES: Record<string, string> = {
    CREATE: '新增',
    UPDATE: '修改',
    DELETE: '删除',
    LOGIN: '登录',
    LOGOUT: '退出登录',
}
