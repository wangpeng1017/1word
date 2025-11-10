import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// 统一小程序字段：
// - vocabularies(question_options) => vocabulary(options)
function mapWrongQuestionsForMiniapp(rows: any[]) {
  return rows.map((wq: any) => {
    const v = wq.vocabularies || wq.vocabulary || {}
    const q = wq.questions || wq.question || {}
    const options = (q.question_options || q.options || [])
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((o: any) => ({ id: o.id, content: o.content, isCorrect: o.isCorrect, order: o.order }))

    return {
      id: wq.id,
      studentId: wq.studentId,
      vocabularyId: wq.vocabularyId,
      questionId: wq.questionId,
      wrongAnswer: wq.wrongAnswer,
      correctAnswer: wq.correctAnswer,
      wrongAt: wq.wrongAt,
      vocabulary: {
        id: v.id,
        word: v.word,
        primaryMeaning: v.primaryMeaning ?? v.primary_meaning,
        secondaryMeaning: v.secondaryMeaning ?? v.secondary_meaning,
        audioUrl: v.audioUrl ?? v.audio_url,
        difficulty: v.difficulty,
        isHighFrequency: v.isHighFrequency ?? v.is_high_frequency,
      },
      question: {
        id: q.id,
        type: q.type,
        content: q.content,
        sentence: q.sentence,
        audioUrl: q.audioUrl,
        correctAnswer: q.correctAnswer,
        options,
      },
    }
  })
}

// GET /api/students/[id]/wrong-questions - 获取学生错题本
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
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
    const wrongQuestionsRaw = await prisma.wrong_questions.findMany({
      where,
      include: {
        vocabularies: true,
        questions: {
          include: {
            question_options: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { wrongAt: 'desc' },
      take: limit,
    })

    // 统一结构
    let shaped = mapWrongQuestionsForMiniapp(wrongQuestionsRaw)

    // 按题型过滤（如果指定）
    if (questionType) {
      shaped = shaped.filter((item) => item.question?.type === questionType)
    }

    // 统计信息
    const stats = {
      total: shaped.length,
      byType: {
        ENGLISH_TO_CHINESE: shaped.filter((i) => i.question?.type === 'ENGLISH_TO_CHINESE').length,
        CHINESE_TO_ENGLISH: shaped.filter((i) => i.question?.type === 'CHINESE_TO_ENGLISH').length,
        LISTENING: shaped.filter((i) => i.question?.type === 'LISTENING').length,
        FILL_IN_BLANK: shaped.filter((i) => i.question?.type === 'FILL_IN_BLANK').length,
      },
    }

    return apiResponse.success({ wrongQuestions: shaped, stats })
  } catch (error) {
    console.error('获取错题本失败:', error)
    return apiResponse.error('获取错题本失败')
  }
}
