import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// 统一小程序字段映射（从 question_answers 表格式化）
function mapWrongQuestionsForMiniapp(rows: any[]) {
  return rows.map((qa: any) => {
    const v = qa.vocabularies || qa.vocabulary || {}
    const q = qa.questions || qa.question || {}
    const options = (q.question_options || q.options || [])
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((o: any) => ({ id: o.id, content: o.content, isCorrect: o.isCorrect, order: o.order }))

    // 获取第一个 meaning
    const firstMeaning = v.word_meanings?.[0]?.meaning || ''

    return {
      id: qa.id,
      studentId: qa.studentId,
      vocabularyId: qa.vocabularyId,
      questionId: qa.questionId,
      wrongAnswer: qa.answer, // question_answers 中是 answer 字段
      correctAnswer: q.correctAnswer,
      wrongAt: qa.answeredAt, // 改用 answeredAt
      vocabulary: {
        id: v.id,
        word: v.word,
        primaryMeaning: firstMeaning,
        secondaryMeaning: null,
        audioUrl: v.audio_url,
        difficulty: v.difficulty,
        isHighFrequency: v.is_high_frequency,
        meanings: v.word_meanings?.map((m: any) => ({
          partOfSpeech: m.partOfSpeech,
          meaning: m.meaning,
        })) || [],
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
// 从 question_answers 表查询（返回所有答错的记录）
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

    // 构建查询条件（使用 question_answers 表，筛选 isCorrect = false）
    const where: any = {
      studentId,
      isCorrect: false, // 只查询错误的答题记录
    }
    if (vocabularyId) {
      where.vocabularyId = vocabularyId
    }

    // 如果指定了题型，需要在 questions 关联上过滤
    if (questionType) {
      where.questions = {
        type: questionType,
      }
    }

    // 查询错题（从 question_answers 表）
    const wrongAnswersRaw = await prisma.question_answers.findMany({
      where,
      include: {
        vocabularies: {
          include: {
            word_meanings: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        questions: {
          include: {
            question_options: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { answeredAt: 'desc' },
      take: limit,
    })

    // 统一结构
    const shaped = mapWrongQuestionsForMiniapp(wrongAnswersRaw)

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
