/**
 * @file 积分验证器
 * @desc 服务端答案验证和防重复积分功能，防止积分刷取漏洞
 * @input 依赖: prisma
 * @output 导出: validateAnswer, validateAnswers, isDuplicatePointsAward, calculatePoints
 */

import { prisma } from '@/lib/prisma'

/**
 * 验证单个答案是否正确（服务端验证）
 * @param questionId 题目ID
 * @param userAnswer 用户提交的答案
 * @returns 答案是否正确
 */
export async function validateAnswer(
  questionId: string,
  userAnswer: string
): Promise<boolean> {
  const question = await prisma.questions.findUnique({
    where: { id: questionId },
    select: { correctAnswer: true, type: true },
  })

  if (!question) {
    return false
  }

  const normalizedUserAnswer = userAnswer.trim().toLowerCase()
  const normalizedCorrectAnswer = question.correctAnswer.trim().toLowerCase()

  return normalizedUserAnswer === normalizedCorrectAnswer
}

/**
 * 答案输入类型
 */
interface AnswerInput {
  questionId: string
  answer: string
  isCorrect: boolean // 客户端提交的（不可信）
  vocabularyId?: string
  timeSpent?: number
}

/**
 * 验证后的答案输出类型
 */
interface ValidatedAnswer {
  questionId: string
  answer: string
  isCorrect: boolean // 服务端验证后的真实结果
  serverValidated: boolean
  vocabularyId?: string
  timeSpent?: number
}

/**
 * 批量验证答案（服务端验证）
 * 忽略客户端提交的 isCorrect，使用数据库中的正确答案进行比对
 */
export async function validateAnswers(
  answers: AnswerInput[]
): Promise<ValidatedAnswer[]> {
  if (!answers || answers.length === 0) {
    return []
  }

  const questionIds = answers.map(a => a.questionId)

  const questions = await prisma.questions.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, correctAnswer: true, type: true },
  })

  const questionMap = new Map(questions.map(q => [q.id, q]))

  return answers.map(answer => {
    const question = questionMap.get(answer.questionId)

    if (!question) {
      // 题目不存在，视为错误
      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect: false,
        serverValidated: true,
        vocabularyId: answer.vocabularyId,
        timeSpent: answer.timeSpent,
      }
    }

    const normalizedUserAnswer = answer.answer.trim().toLowerCase()
    const normalizedCorrectAnswer = question.correctAnswer.trim().toLowerCase()
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer

    return {
      questionId: answer.questionId,
      answer: answer.answer,
      isCorrect, // 服务端验证的结果，忽略客户端提交的
      serverValidated: true,
      vocabularyId: answer.vocabularyId,
      timeSpent: answer.timeSpent,
    }
  })
}

/**
 * 检查是否重复发放积分
 * @param studentId 学生ID
 * @param relatedType 关联类型 (study_record, test_record 等)
 * @param relatedId 关联ID
 * @returns 是否已经发放过积分
 */
export async function isDuplicatePointsAward(
  studentId: string,
  relatedType: string,
  relatedId: string
): Promise<boolean> {
  const existing = await prisma.point_history.findFirst({
    where: {
      studentId,
      relatedType,
      relatedId,
    },
  })

  return existing !== null
}

/**
 * 积分计算输入
 */
interface PointsCalculationInput {
  correctCount: number
  totalWords: number
  accuracy: number
}

/**
 * 积分计算结果
 */
interface PointsCalculationResult {
  basePoints: number
  completionBonus: number
  perfectBonus: number
  totalPoints: number
}

/**
 * 计算应得积分（纯函数，无副作用）
 */
export function calculatePoints(input: PointsCalculationInput): PointsCalculationResult {
  const basePoints = Math.max(0, input.correctCount) // 每答对1题得1分
  const completionBonus = 5 // 完成奖励
  const perfectBonus = input.accuracy === 1 ? 3 : 0 // 全对奖励

  return {
    basePoints,
    completionBonus,
    perfectBonus,
    totalPoints: basePoints + completionBonus + perfectBonus,
  }
}
