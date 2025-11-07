import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { QuestionCreateInput } from '@/types'

// 为词汇添加题目
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以添加题目')
    }

    const body: QuestionCreateInput = await request.json()
    const { type, content, audioUrl, correctAnswer, options } = body

    if (!type || !content || !correctAnswer || !options || options.length !== 4) {
      return errorResponse('题目信息不完整，需要4个选项')
    }

    // 验证词汇是否存在
    const vocabulary = await prisma.vocabularies.findUnique({
      where: { id: params.id },
    })

    if (!vocabulary) {
      return errorResponse('词汇不存在', 404)
    }

    // 创建题目和选项
    const question = await prisma.questions.create({
      data: {
        vocabularyId: params.id,
        type,
        content,
        audioUrl,
        correctAnswer,
        question_options: {
          create: options.map((opt, index) => ({
            content: opt.content,
            isCorrect: opt.isCorrect,
            order: opt.order || index + 1,
          })),
        },
      },
      include: {
        question_options: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return successResponse(question, '题目创建成功')
  } catch (error) {
    console.error('创建题目错误:', error)
    return errorResponse('创建题目失败', 500)
  }
}

// 获取词汇的所有题目
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

    const questions = await prisma.questions.findMany({
      where: { vocabularyId: params.id },
      include: {
        question_options: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(questions)
  } catch (error) {
    console.error('获取题目列表错误:', error)
    return errorResponse('获取题目列表失败', 500)
  }
}
