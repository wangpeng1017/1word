import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * 获取单个题目详情
 * GET /api/questions/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const question = await prisma.questions.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        content: true,
        sentence: true,
        audioUrl: true,
        correctAnswer: true,
        createdAt: true,
        updatedAt: true,
        vocabularyId: true,
        vocabularies: {
          select: {
            word: true,
            primary_meaning: true,
          },
        },
        question_options: {
          select: {
            id: true,
            content: true,
            isCorrect: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!question) {
      return errorResponse('题目不存在', 404)
    }

    // 转换数据格式
    const formattedQuestion = {
      id: question.id,
      type: question.type,
      content: question.content,
      sentence: question.sentence,
      audioUrl: question.audioUrl,
      correctAnswer: question.correctAnswer,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      vocabularyId: question.vocabularyId,
      vocabulary: {
        word: question.vocabularies?.word || '',
        primaryMeaning: question.vocabularies?.primary_meaning || '',
      },
      options: question.question_options?.map((opt: any) => ({
        id: opt.id,
        content: opt.content,
        isCorrect: opt.isCorrect,
        order: opt.order,
      })) || [],
    }

    return successResponse(formattedQuestion)
  } catch (error: any) {
    console.error('获取题目详情错误:', error)
    return errorResponse(`获取题目详情失败: ${error?.message || '未知错误'}`, 500)
  }
}
