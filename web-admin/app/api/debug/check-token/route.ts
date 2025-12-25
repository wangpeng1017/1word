/**
 * 调试 API：检查当前 token 的 payload
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromHeader(request.headers.get('Authorization'))

        if (!token) {
            return NextResponse.json({
                success: false,
                error: '未提供 token',
            }, { status: 401 })
        }

        const payload = verifyToken(token)

        if (!payload) {
            return NextResponse.json({
                success: false,
                error: 'token 无效或已过期',
            }, { status: 401 })
        }

        return NextResponse.json({
            success: true,
            data: {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                roleType: typeof payload.role,
                isAdmin: payload.role === 'ADMIN',
                isTeacher: payload.role === 'TEACHER',
                isStudent: payload.role === 'STUDENT',
                hasPermission: payload.role === 'ADMIN' || payload.role === 'TEACHER',
            },
        })
    } catch (error) {
        console.error('检查 token 错误:', error)
        return NextResponse.json({
            success: false,
            error: '检查 token 失败',
        }, { status: 500 })
    }
}
