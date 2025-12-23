import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, hashPassword } from '@/lib/auth'
import { recordLog, getClientInfo } from '@/lib/log'

/**
 * 获取管理员账号列表
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

        // 获取所有管理员账号（TEACHER 和 ADMIN 角色）
        const accounts = await prisma.user.findMany({
            where: {
                role: { in: ['TEACHER', 'ADMIN'] },
            },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
                role: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: { created_at: 'desc' },
        })

        return NextResponse.json({
            success: true,
            data: accounts,
        })
    } catch (error) {
        console.error('获取账号列表失败:', error)
        return NextResponse.json({ success: false, error: '获取账号列表失败' }, { status: 500 })
    }
}

/**
 * 新增管理员账号
 */
export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromHeader(request.headers.get('Authorization'))
        if (!token) {
            return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
        }

        const payload = verifyToken(token)
        if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
        }

        const body = await request.json()
        const { name, email, phone, password } = body

        // 验证必填字段
        if (!name || !password) {
            return NextResponse.json({ success: false, error: '用户名和密码为必填项' }, { status: 400 })
        }

        if (!email && !phone) {
            return NextResponse.json({ success: false, error: '邮箱或手机号至少填写一项' }, { status: 400 })
        }

        // 检查邮箱或手机号是否已存在
        if (email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } })
            if (existingEmail) {
                return NextResponse.json({ success: false, error: '该邮箱已被使用' }, { status: 400 })
            }
        }

        if (phone) {
            const existingPhone = await prisma.user.findUnique({ where: { phone } })
            if (existingPhone) {
                return NextResponse.json({ success: false, error: '该手机号已被使用' }, { status: 400 })
            }
        }

        // 加密密码
        const hashedPassword = await hashPassword(password)

        // 创建账号（角色设为 ADMIN，权限与当前用户一致）
        const newAccount = await prisma.user.create({
            data: {
                id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                name,
                email: email || null,
                phone: phone || null,
                password: hashedPassword,
                role: 'ADMIN',
                is_active: true,
                updated_at: new Date(),
            },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
                role: true,
                is_active: true,
                created_at: true,
            },
        })

        // 获取当前操作者信息
        const operator = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { name: true },
        })

        // 记录操作日志
        const clientInfo = getClientInfo(request)
        await recordLog({
            userId: payload.userId,
            userName: operator?.name || '未知用户',
            action: 'CREATE',
            module: 'accounts',
            target: `管理员账号: ${name}`,
            targetId: newAccount.id,
            detail: { email, phone },
            ...clientInfo,
        })

        return NextResponse.json({
            success: true,
            data: newAccount,
            message: '账号创建成功',
        })
    } catch (error) {
        console.error('创建账号失败:', error)
        return NextResponse.json({ success: false, error: '创建账号失败' }, { status: 500 })
    }
}
