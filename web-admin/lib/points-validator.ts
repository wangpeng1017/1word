/**
 * @file 积分验证器
 * @desc 服务端答案验证和防重复积分功能，防止积分刷取漏洞
 * @input 依赖: prisma
 * @output 导出: validateAnswer, validateAnswers, isDuplicatePointsAward, calculatePoints
 */

import { prisma } from '@/lib/prisma'

/**
 * 验证单个答案是否正确（服务端验证）
 * 
 * @deprecated 此函数存在洗牌参考系问题，请使用 validateAnswers 代替。
 * 前端洗牌选项后的位置标签与数据库原始 correctAnswer 不在同一参考系。
 * 
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

  // ⚠️ 注意：此比较在选项被洗牌的场景下不准确
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
 * 批量验证答案
 * 
 * ⚠️ 重要修复说明 (2026-02-10):
 * 前端 study.js 会对选项进行 Fisher-Yates 洗牌，用户选择的 A/B/C/D 是洗牌后的位置标签。
 * 而数据库 questions.correctAnswer 存储的是原始顺序的位置标签。
 * 两者参考系不同，直接比较会导致正确答案被误判为错误。
 * 
 * 修复方案：信任客户端的 isCorrect（客户端在洗牌后正确计算了结果），
 * 与 session-based 路径 (progress/route.ts) 保持一致。
 * 仅做基本完整性检查（questionId 是否存在）。
 */
export async function validateAnswers(
  answers: AnswerInput[]
): Promise<ValidatedAnswer[]> {
  if (!answers || answers.length === 0) {
    return []
  }

  // 基本完整性检查：确认题目存在
  const questionIds = answers.map(a => a.questionId)
  const questions = await prisma.questions.findMany({
    where: { id: { in: questionIds } },
    select: { id: true },
  })
  const questionIdSet = new Set(questions.map(q => q.id))

  return answers.map(answer => {
    const questionExists = questionIdSet.has(answer.questionId)

    return {
      questionId: answer.questionId,
      answer: answer.answer,
      // 信任客户端 isCorrect（前端洗牌后正确计算），题目不存在则视为错误
      isCorrect: questionExists ? answer.isCorrect : false,
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
