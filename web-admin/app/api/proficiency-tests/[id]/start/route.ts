import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { allocateQuestionTypes } from '@/lib/question-type-allocator'

// POST /api/proficiency-tests/[id]/start - 开始测试（生成测试题目）
export async function POST(
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
    const body = await request.json()
    const { studentId } = body

    if (!studentId) {
      return apiResponse.error('参数错误：studentId为必填项', 400)
    }

    // 验证测试题库是否存在
    const test = await prisma.proficiency_tests.findUnique({
      where: { id }
    })

    if (!test) {
      return apiResponse.error('测试题库不存在', 404)
    }

    if (!test.isActive) {
      return apiResponse.error('该测试题库已停用', 400)
    }

    // 验证学生是否存在
    const student = await prisma.students.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return apiResponse.error('学生不存在', 404)
    }

    // 获取测试词汇
    const vocabularies = await prisma.vocabularies.findMany({
      where: {
        id: { in: test.vocabularyIds }
      }
    })

    if (vocabularies.length === 0) {
      return apiResponse.error('测试题库中没有词汇', 400)
    }

    // 为每个词汇生成题目
    const totalWords = vocabularies.length
    const questionTypeAllocation = allocateQuestionTypes(totalWords)

    const questions: any[] = []
    let currentIndex = 0

    for (const allocation of questionTypeAllocation) {
      const { type, count } = allocation

      for (let i = 0; i < count && currentIndex < vocabularies.length; i++) {
        const vocabulary = vocabularies[currentIndex]
        currentIndex++

        // 获取该词汇的题目
        const vocabQuestions = await prisma.questions.findMany({
          where: {
            vocabularyId: vocabulary.id,
            type
          },
          include: {
            question_options: {
              orderBy: { order: 'asc' }
            }
          }
        })

        if (vocabQuestions.length > 0) {
          // 随机选择一个题目
          const randomQuestion = vocabQuestions[Math.floor(Math.random() * vocabQuestions.length)]
          questions.push({
            questionId: randomQuestion.id,
            vocabularyId: vocabulary.id,
            type: randomQuestion.type,
            content: randomQuestion.content,
            sentence: randomQuestion.sentence,
            audioUrl: randomQuestion.audioUrl,
            options: randomQuestion.question_options.map(opt => ({
              id: opt.id,
              content: opt.content,
              order: opt.order
            })),
            // 不返回正确答案
          })
        } else {
          // 如果没有该类型的题目，尝试其他类型
          const anyQuestion = await prisma.questions.findFirst({
            where: {
              vocabularyId: vocabulary.id
            },
            include: {
              question_options: {
                orderBy: { order: 'asc' }
              }
            }
          })

          if (anyQuestion) {
            questions.push({
              questionId: anyQuestion.id,
              vocabularyId: vocabulary.id,
              type: anyQuestion.type,
              content: anyQuestion.content,
              sentence: anyQuestion.sentence,
              audioUrl: anyQuestion.audioUrl,
              options: anyQuestion.question_options.map(opt => ({
                id: opt.id,
                content: opt.content,
                order: opt.order
              })),
            })
          }
        }
      }
    }

    // 打乱题目顺序
    questions.sort(() => Math.random() - 0.5)

    return apiResponse.success({
      testId: test.id,
      testName: test.name,
      description: test.description,
      totalWords: test.totalWords,
      passScore: test.passScore,
      duration: test.duration,
      questions,
      startedAt: new Date()
    })
  } catch (error: any) {
    console.error('开始测试失败:', error)
    return apiResponse.error(`开始测试失败: ${error?.message || '未知错误'}`)
  }
}
