import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/test-records/[id] - 获取词汇量测试记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const { id } = params

    const record = await prisma.vocabulary_quiz_records.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            student_no: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            classes: {
              select: {
                name: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionNo: true,
                word: true,
                questionText: true,
                questionType: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                optionE: true,
                correctOption: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    })

    if (!record) {
      return apiResponse.error('测试记录不存在', 404)
    }

    return apiResponse.success(record)
  } catch (error: any) {
    console.error('获取测试记录详情失败:', error)
    return apiResponse.error(`获取测试记录详情失败: ${error?.message || '未知错误'}`)
  }
}
