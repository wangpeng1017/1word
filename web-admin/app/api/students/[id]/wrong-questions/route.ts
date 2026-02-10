/**
 * @file wrong-questions route
 * @desc 错题本 API - 查询最新答题状态仍为错误的单词
 * @logic 对于每个(vocabularyId, questionId)组合，只取最新的一条答题记录
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// 统一小程序字段映射
function mapWrongQuestionsForMiniapp(rows: any[]) {
  return rows.map((qa: any) => {
    const v = qa.vocabularies || qa.vocabulary || {}
    const q = qa.questions || qa.question || {}
    const options = (q.question_options || q.options || [])
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((o: any) => ({ id: o.id, content: o.content, isCorrect: o.isCorrect, order: o.order }))

    const firstMeaning = v.word_meanings?.[0]?.meaning || ''

    // 正确答案：使用 question_options 中 isCorrect=true 的选项内容（而非位置标签）
    const correctOption = options.find((o: any) => o.isCorrect)
    const correctAnswerContent = correctOption?.content || q.correctAnswer

    // 用户答案：洗牌后位置标签无法可靠映射回原始选项，直接标记为"答错了"
    const wrongAnswerContent = '答错了'

    return {
      id: qa.id,
      studentId: qa.studentId,
      vocabularyId: qa.vocabularyId,
      questionId: qa.questionId,
      wrongAnswer: wrongAnswerContent,
      correctAnswer: correctAnswerContent,
      wrongAt: qa.answeredAt,
      vocabulary: {
        id: v.id,
        word: v.word,
        primaryMeaning: firstMeaning,
        secondaryMeaning: null,
        audioUrl: v.audio_url,
        difficulty: v.difficulty,
        isHighFrequency: v.is_high_frequency,
        word_audios: v.word_audios || [], // 新增：传递音频列表
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
        correctAnswer: correctAnswerContent,
        options,
      },
    }
  })
}

// GET /api/students/[id]/wrong-questions - 获取学生错题本
// 逻辑：对于每个(单词,题目)组合，查询最新的答题记录，只返回最新记录为错误的
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

    // 使用原生 SQL 查询：对于每个(vocabularyId, questionId)组合，获取最新答题记录
    // 然后筛选出最新记录 isCorrect = false 的
    let sql = `
      SELECT latest_answers.*
      FROM (
        SELECT
          qa.id,
          qa.studentId,
          qa.vocabularyId,
          qa.questionId,
          qa.answer,
          qa.isCorrect,
          qa.answeredAt,
          ROW_NUMBER() OVER (
            PARTITION BY qa.vocabularyId, qa.questionId
            ORDER BY qa.answeredAt DESC
          ) as rn
        FROM question_answers qa
        WHERE qa.studentId = ?
          ${vocabularyId ? 'AND qa.vocabularyId = ?' : ''}
      ) latest_answers
      WHERE latest_answers.rn = 1
        AND latest_answers.isCorrect = 0
      ORDER BY latest_answers.answeredAt DESC
      LIMIT ?
    `

    // 构建参数
    const params: any[] = [studentId]
    if (vocabularyId) {
      params.push(vocabularyId)
    }
    params.push(limit)

    // 执行查询
    const rawWrongAnswers = await prisma.$queryRawUnsafe(sql, ...params)

    // 获取完整的词汇和题目信息
    const wrongAnswersWithDetails = await prisma.question_answers.findMany({
      where: {
        id: { in: (rawWrongAnswers as any[]).map((r: any) => r.id) },
      },
      include: {
        vocabularies: {
          include: {
            word_meanings: {
              orderBy: { orderIndex: 'asc' },
            },
            word_audios: true, // 新增：包含音频信息
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
    })

    // 如果指定了题型，在内存中过滤（Prisma 不支持在 findMany 中过滤关联）
    let filtered = wrongAnswersWithDetails
    if (questionType) {
      filtered = wrongAnswersWithDetails.filter(
        (qa: any) => qa.questions?.type === questionType
      )
    }

    // 统一结构
    const shaped = mapWrongQuestionsForMiniapp(filtered)

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
