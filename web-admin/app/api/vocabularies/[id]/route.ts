import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/response'

// 获取单个词汇详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const vocabulary = await prisma.vocabularies.findUnique({
      where: { id: params.id },
    })

    if (!vocabulary) {
      return notFoundResponse('词汇不存在')
    }

    const { audio_url, created_at, updated_at, ...rest } = vocabulary as any
    return successResponse({ ...rest, audioUrl: audio_url ?? null, createdAt: created_at, updatedAt: updated_at })
  } catch (error) {
    console.error('获取词汇详情错误:', error)
    return errorResponse('获取词汇详情失败', 500)
  }
}

// 更新词汇
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以更新词汇')
    }

    const body = await request.json()
    const {
      word,
      partOfSpeech,
      primaryMeaning,
      secondaryMeaning,
      phonetic,
      phoneticUS,
      phoneticUK,
      audioUrl,
      isHighFrequency,
      difficulty,
    } = body

    const updateData: any = {}
    if (typeof audioUrl !== 'undefined') {
      updateData.audio_url = audioUrl
    }

    const vocabulary = await prisma.vocabularies.update({
      where: { id: params.id },
      data: updateData,
    })

    const { audio_url, created_at, updated_at, ...rest } = vocabulary as any
    return successResponse({ ...rest, audioUrl: audio_url ?? null, createdAt: created_at, updatedAt: updated_at }, '词汇更新成功')
  } catch (error) {
    console.error('更新词汇错误:', error)
    return errorResponse('更新词汇失败', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除词汇')
    }

    await prisma.vocabularies.delete({
      where: { id: params.id },
    })

    return successResponse(null, '词汇删除成功')
  } catch (error) {
    console.error('删除词汇错误:', error)
    return errorResponse('删除词汇失败', 500)
  }
}
