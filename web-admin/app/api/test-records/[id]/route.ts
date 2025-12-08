import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/test-records/[id] - 获取测试记录详情
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

    const record = await prisma.test_records.findUnique({
      where: { id },
      include: {
        proficiency_tests: {
          select: {
            id: true,
            name: true,
            description: true,
            totalWords: true,
            passScore: true,
            duration: true
          }
        },
        students: {
          select: {
            id: true,
            student_no: true,
            grade: true,
            user: {
              select: {
                name: true,
                email: true
              }
            },
            classes: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!record) {
      return apiResponse.error('测试记录不存在', 404)
    }

    // 获取答题详情中的词汇信息
    const answers = record.answers as any[]
    const vocabularyIds = answers.map((a: any) => a.vocabularyId)

    const vocabularies = await prisma.vocabularies.findMany({
      where: {
        id: { in: vocabularyIds }
      },
      select: {
        id: true,
        word: true,
        primary_meaning: true,
        phonetic: true,
        audio_url: true
      }
    })

    // 将词汇信息合并到答题详情中
    const answersWithVocabulary = answers.map((answer: any) => {
      const vocabulary = vocabularies.find(v => v.id === answer.vocabularyId)
      return {
        ...answer,
        vocabulary
      }
    })

    return apiResponse.success({
      ...record,
      answers: answersWithVocabulary
    })
  } catch (error: any) {
    console.error('获取测试记录详情失败:', error)
    return apiResponse.error(`获取测试记录详情失败: ${error?.message || '未知错误'}`)
  }
}
