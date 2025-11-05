import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/response'

/**
 * 删除文件
 * DELETE /api/vocabularies/[id]/files/[fileId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除文件')
    }

    const { fileId } = params

    // 尝试查找音频文件
    let file: any = await prisma.wordAudio.findUnique({
      where: { id: fileId },
    })

    let fileType = 'audio'

    // 如果不是音频,尝试查找图片文件
    if (!file) {
      file = await prisma.wordImage.findUnique({
        where: { id: fileId },
      })
      fileType = 'image'
    }

    if (!file) {
      return errorResponse('文件不存在', 404)
    }

    // 从Vercel Blob删除文件
    try {
      await del(file.url)
    } catch (error) {
      console.error('从Blob删除文件失败:', error)
      // 即使Blob删除失败,也继续删除数据库记录
    }

    // 从数据库删除记录
    if (fileType === 'audio') {
      await prisma.wordAudio.delete({
        where: { id: fileId },
      })
    } else {
      await prisma.wordImage.delete({
        where: { id: fileId },
      })
    }

    return successResponse(null, '文件删除成功')
  } catch (error) {
    console.error('删除文件失败:', error)
    return errorResponse('删除文件失败', 500)
  }
}
