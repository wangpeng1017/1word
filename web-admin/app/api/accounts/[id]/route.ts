import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, hashPassword } from '@/lib/auth'
import { recordLog, getClientInfo } from '@/lib/log'

/**
 * 获取账号详情
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromHeader(request.headers.get('Authorization'))
        if (!token) {
            return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
        }

        const payload = verifyToken(token)
        if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
        }

        const account = await prisma.user.findUnique({
            where: { id: params.id },
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
        })

        if (!account) {
            return NextResponse.json({ success: false, error: '账号不存在' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: account })
    } catch (error) {
        console.error('获取账号详情失败:', error)
        return NextResponse.json({ success: false, error: '获取账号详情失败' }, { status: 500 })
    }
}

/**
 * 更新账号信息
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        const { name, email, phone, password, is_active } = body

        // 检查账号是否存在
        const existingAccount = await prisma.user.findUnique({
            where: { id: params.id },
        })

        if (!existingAccount) {
            return NextResponse.json({ success: false, error: '账号不存在' }, { status: 404 })
        }

        // 验证邮箱唯一性（排除当前账号）
        if (email && email !== existingAccount.email) {
            const emailExists = await prisma.user.findFirst({
                where: { email, id: { not: params.id } },
            })
            if (emailExists) {
                return NextResponse.json({ success: false, error: '该邮箱已被使用' }, { status: 400 })
            }
        }

        // 验证手机号唯一性（排除当前账号）
        if (phone && phone !== existingAccount.phone) {
            const phoneExists = await prisma.user.findFirst({
                where: { phone, id: { not: params.id } },
            })
            if (phoneExists) {
                return NextResponse.json({ success: false, error: '该手机号已被使用' }, { status: 400 })
            }
        }

        // 准备更新数据
        const updateData: any = {
            updated_at: new Date(),
        }

        if (name) updateData.name = name
        if (email !== undefined) updateData.email = email || null
        if (phone !== undefined) updateData.phone = phone || null
        if (typeof is_active === 'boolean') updateData.is_active = is_active
        if (password) updateData.password = await hashPassword(password)

        // 更新账号
        const updatedAccount = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
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
            action: 'UPDATE',
            module: 'accounts',
            target: `管理员账号: ${existingAccount.name}`,
            targetId: params.id,
            detail: {
                changes: { name, email, phone, is_active, passwordChanged: !!password }
            },
            ...clientInfo,
        })

        return NextResponse.json({
            success: true,
            data: updatedAccount,
            message: '账号更新成功',
        })
    } catch (error) {
        console.error('更新账号失败:', error)
        return NextResponse.json({ success: false, error: '更新账号失败' }, { status: 500 })
    }
}

/**
 * 删除账号
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = getTokenFromHeader(request.headers.get('Authorization'))
        if (!token) {
            return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
        }

        const payload = verifyToken(token)
        if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: '无权限' }, { status: 403 })
        }

        // 不能删除自己
        if (params.id === payload.userId) {
            return NextResponse.json({ success: false, error: '不能删除自己的账号' }, { status: 400 })
        }

        // 检查账号是否存在
        const existingAccount = await prisma.user.findUnique({
            where: { id: params.id },
            select: { id: true, name: true, role: true },
        })

        if (!existingAccount) {
            return NextResponse.json({ success: false, error: '账号不存在' }, { status: 404 })
        }

        // 只能删除 ADMIN 角色的账号，保护 TEACHER（主管理员）
        if (existingAccount.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: '不能删除主管理员账号' }, { status: 400 })
        }

        // 删除账号
        await prisma.user.delete({
            where: { id: params.id },
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
            action: 'DELETE',
            module: 'accounts',
            target: `管理员账号: ${existingAccount.name}`,
            targetId: params.id,
            ...clientInfo,
        })

        return NextResponse.json({
            success: true,
            message: '账号删除成功',
        })
    } catch (error) {
        console.error('删除账号失败:', error)
        return NextResponse.json({ success: false, error: '删除账号失败' }, { status: 500 })
    }
}
