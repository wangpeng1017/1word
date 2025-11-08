import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// 获取题目列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const vocabularyId = searchParams.get('vocabularyId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (vocabularyId) {
      where.vocabularyId = vocabularyId
    }
    
    if (type) {
      where.type = type
    }

    const [questions, total] = await Promise.all([
      prisma.questions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vocabularies: {
            select: {
              word: true,
              primary_meaning: true,
            },
          },
          question_options: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.questions.count({ where }),
    ])

    // 转换数据格式以匹配前端
    const formattedQuestions = questions.map((q: any) => ({
      id: q.id,
      type: q.type,
      content: q.content,
      sentence: q.sentence,
      audioUrl: q.audioUrl,
      correctAnswer: q.correctAnswer,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      vocabularyId: q.vocabularyId,
      vocabulary: {
        word: q.vocabularies?.word || '',
        primaryMeaning: q.vocabularies?.primary_meaning || '',
      },
      options: q.question_options?.map((opt: any) => ({
        id: opt.id,
        content: opt.content,
        isCorrect: opt.isCorrect,
        order: opt.order,
      })) || [],
    }))

    return successResponse({
      questions: formattedQuestions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('获取题目列表错误:', error)
    return errorResponse(`获取题目列表失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 创建题目
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以创建题目')
    }

    const body = await request.json()
    const { vocabularyId, type, content, sentence, audioUrl, correctAnswer, options } = body

    if (!vocabularyId || !type || !content || !correctAnswer) {
      return errorResponse('缺少必要字段')
    }

    // 验证词汇是否存在
    const vocabulary = await prisma.vocabularies.findUnique({
      where: { id: vocabularyId },
    })

    if (!vocabulary) {
      return errorResponse('词汇不存在')
    }

    // 创建题目和选项
    const question = await prisma.questions.create({
      data: {
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vocabularyId,
        type,
        content,
        sentence,
        audioUrl,
        correctAnswer,
        createdAt: new Date(),
        updatedAt: new Date(),
        question_options: {
          create: options?.map((opt: any, index: number) => ({
            id: `qo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: opt.content,
            isCorrect: opt.isCorrect,
            order: opt.order ?? index,
            createdAt: new Date(),
          })) || [],
        },
      },
      include: {
        vocabularies: {
          select: {
            word: true,
            primary_meaning: true,
          },
        },
        question_options: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // 转换数据格式以匹配前端
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

    return successResponse(formattedQuestion, '题目创建成功')
  } catch (error: any) {
    console.error('创建题目错误:', error)
    return errorResponse(`创建题目失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 更新题目
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以更新题目')
    }

    const body = await request.json()
    const { id, type, content, sentence, audioUrl, correctAnswer, options } = body

    if (!id) {
      return errorResponse('缺少题目ID')
    }

    // 更新题目（先删除旧选项再创建新选项）
    await prisma.question_options.deleteMany({
      where: { questionId: id },
    })

    await prisma.questions.update({
      where: { id },
      data: {
        type,
        content,
        sentence,
        audioUrl,
        correctAnswer,
        updatedAt: new Date(),
        question_options: {
          create: options?.map((opt: any, index: number) => ({
            id: `qo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: opt.content,
            isCorrect: opt.isCorrect,
            order: opt.order ?? index,
            createdAt: new Date(),
          })) || [],
        },
      },
    })

    const question = await prisma.questions.findUnique({
      where: { id },
      include: {
        vocabularies: {
          select: {
            word: true,
            primary_meaning: true,
          },
        },
        question_options: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // 转换数据格式以匹配前端
    const formattedQuestion = question ? {
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
    } : null

    return successResponse(formattedQuestion, '题目更新成功')
  } catch (error: any) {
    console.error('更新题目错误:', error)
    return errorResponse(`更新题目失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 批量删除题目
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除题目')
    }

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return errorResponse('缺少题目ID')
    }

    await prisma.questions.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return successResponse(null, '题目删除成功')
  } catch (error: any) {
    console.error('删除题目错误:', error)
    return errorResponse(`删除题目失败: ${error?.message || '未知错误'}`, 500)
  }
}
