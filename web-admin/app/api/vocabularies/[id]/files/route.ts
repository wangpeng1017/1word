import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { unauthorizedResponse, errorResponse, successResponse } from '@/lib/response'

/**
 * 获取词汇的文件列表
 * GET /api/vocabularies/[id]/files?type=audio|image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以访问')
    }

    const { id: vocabularyId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // audio, image, all

    let files: any[] = []

    if (type === 'audio' || type === 'all') {
      const audioFiles = await prisma.wordAudio.findMany({
        where: { vocabularyId },
        orderBy: { createdAt: 'desc' },
      })
      files = [...files, ...audioFiles.map(f => ({ ...f, type: 'audio' }))]
    }

    if (type === 'image' || type === 'all') {
      const imageFiles = await prisma.wordImage.findMany({
        where: { vocabularyId },
        orderBy: { createdAt: 'desc' },
      })
      files = [...files, ...imageFiles.map(f => ({ ...f, type: 'image' }))]
    }

    return successResponse(files)
  } catch (error) {
    console.error('获取文件列表失败:', error)
    return errorResponse('获取文件列表失败', 500)
  }
}

/**
 * 保存文件记录到数据库
 * POST /api/vocabularies/[id]/files
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以保存文件')
    }

    const { id: vocabularyId } = await params
    const { type, url, filename } = await request.json()

    if (!type || !url || !filename) {
      return errorResponse('缺少必要参数')
    }

    // 验证词汇是否存在
    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
    })

    if (!vocabulary) {
      return errorResponse('词汇不存在', 404)
    }

    let file: any

    if (type === 'audio') {
      file = await prisma.wordAudio.create({
        data: {
          vocabularyId,
          audioUrl: url,
        },
      })
    } else if (type === 'image') {
      file = await prisma.wordImage.create({
        data: {
          vocabularyId,
          imageUrl: url,
        },
      })
    } else {
      return errorResponse('不支持的文件类型')
    }

    return successResponse(file, '文件保存成功')
  } catch (error) {
    console.error('保存文件失败:', error)
    return errorResponse('保存文件失败', 500)
  }
}
