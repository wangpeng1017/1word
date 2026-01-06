import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/response'

/**
 * 删除文件
 * DELETE /api/vocabularies/[id]/files/[fileId]
 *
 * 注意：此 API 仅删除数据库记录，不删除云存储文件
 * 原因：
 * 1. 图片存储在阿里云 OSS（本地路径 /images/xxx）
 * 2. 音频使用外部 API（有道、dictionaryapi.dev）
 * 3. 历史数据可能有 Vercel Blob URL，但已不再维护
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以删除文件')
    }

    const { fileId } = await params

    // 尝试查找音频文件
    let file: any = await prisma.word_audios.findUnique({
      where: { id: fileId },
    })

    let fileType = 'audio'

    // 如果不是音频,尝试查找图片文件
    if (!file) {
      file = await prisma.word_images.findUnique({
        where: { id: fileId },
      })
      fileType = 'image'
    }

    if (!file) {
      return errorResponse('文件不存在', 404)
    }

    // 从数据库删除记录
    // 注意：云存储文件不在此删除，需要手动管理
    if (fileType === 'audio') {
      await prisma.word_audios.delete({
        where: { id: fileId },
      })
    } else {
      await prisma.word_images.delete({
        where: { id: fileId },
      })
    }

    return successResponse(null, '文件删除成功（仅删除数据库记录）')
  } catch (error) {
    console.error('删除文件失败:', error)
    return errorResponse('删除文件失败', 500)
  }
}
