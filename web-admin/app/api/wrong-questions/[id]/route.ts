/**
 * @file route.ts
 * @desc 删除错题记录API
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE /api/wrong-questions/[id] - 删除错题记录
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const wrongQuestionId = params.id

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
