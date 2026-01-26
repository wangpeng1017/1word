/**
 * @file route.ts
 * @desc 删除错题记录API（支持幂等性）
 * @input 依赖: prisma, wrong_questions表
 * @output 导出: DELETE /api/wrong-questions/[id]
 * @pos 错题管理模块 - 删除单条错题
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/wrong-questions/[id] - 删除错题记录
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: wrongQuestionId } = await params

        // 先检查记录是否存在（幂等性处理）
        const existing = await prisma.wrong_questions.findUnique({
            where: { id: wrongQuestionId },
        })

        // 如果记录不存在，直接返回成功（幂等性）
        if (!existing) {
            return NextResponse.json({
                success: true,
                message: '错题已移除（记录不存在）',
            })
        }

        // 删除错题记录
        await prisma.wrong_questions.delete({
            where: { id: wrongQuestionId },
        })

        return NextResponse.json({
            success: true,
            message: '错题已移除',
        })
    } catch (error) {
        console.error('[API] 删除错题失败:', error)
        return NextResponse.json(
            {
                success: false,
                error: '删除错题失败',
            },
            { status: 500 }
        )
    }
}
