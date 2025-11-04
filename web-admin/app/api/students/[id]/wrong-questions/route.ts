import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/students/[id]/wrong-questions - 获取学生错题本
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证token
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const studentId = params.id
    const { searchParams } = new URL(request.url)
    const vocabularyId = searchParams.get('vocabularyId')
    const questionType = searchParams.get('questionType')
    const limit = parseInt(searchParams.get('limit') || '50')

    // 构建查询条件
    const where: any = { studentId }
    if (vocabularyId) {
      where.vocabularyId = vocabularyId
    }

    // 查询错题
    const wrongQuestions = await prisma.wrongQuestion.findMany({
      where,
      include: {
        vocabulary: true,
        question: {
          include: {
            options: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        wrongAt: 'desc',
      },
      take: limit,
    })

    // 按题型过滤（如果指定）
    let filteredQuestions = wrongQuestions
    if (questionType) {
      filteredQuestions = wrongQuestions.filter(
        (wq) => wq.question.type === questionType
      )
    }

    // 统计信息
    const stats = {
      total: filteredQuestions.length,
      byType: {
        ENGLISH_TO_CHINESE: wrongQuestions.filter(
          (wq) => wq.question.type === 'ENGLISH_TO_CHINESE'
        ).length,
        CHINESE_TO_ENGLISH: wrongQuestions.filter(
          (wq) => wq.question.type === 'CHINESE_TO_ENGLISH'
        ).length,
        LISTENING: wrongQuestions.filter(
          (wq) => wq.question.type === 'LISTENING'
        ).length,
        FILL_IN_BLANK: wrongQuestions.filter(
          (wq) => wq.question.type === 'FILL_IN_BLANK'
        ).length,
      },
    }

    return apiResponse.success({
      wrongQuestions: filteredQuestions,
      stats,
    })
  } catch (error) {
    console.error('获取错题本失败:', error)
    return apiResponse.error('获取错题本失败')
  }
}
