/**
 * @file 学习进度增量更新 API
 * @desc 每答一题调用，实时同步进度到服务器
 * - PATCH: 增量更新进度（单题）
 * - POST: 批量同步进度（离线恢复时）
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { generateId } from '@/lib/id'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/study-sessions/:id/progress - 增量更新单题进度
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { id: sessionId } = await params
    const { answer } = await request.json()

    if (!answer || !answer.vocabularyId || !answer.questionId) {
      return apiResponse.error('参数错误：需要 answer 对象', 400)
    }

    const now = new Date()

    // 查找会话
    const session = await prisma.study_records.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return apiResponse.error('学习会话不存在', 404)
    }

    if (session.status !== 'IN_PROGRESS') {
      return apiResponse.error('学习会话已结束', 400)
    }

    // 检查是否重复提交（幂等性）
    const existingAnswer = await prisma.question_answers.findFirst({
      where: {
        studentId: session.studentId,
        vocabularyId: answer.vocabularyId,
        questionId: answer.questionId,
        answeredAt: {
          gte: session.startedAt,
        },
      },
    })

    if (existingAnswer) {
      // 已存在，返回当前进度（幂等）
      return apiResponse.success({
        message: '答题记录已存在（重复提交已忽略）',
        duplicate: true,
        completedWords: session.completedWords,
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
      })
    }

    // 创建答题记录并更新会话进度（accuracy 也在事务内更新，避免并发覆盖）
    const updatedSession = await prisma.$transaction(async (tx) => {
      // 创建答题记录
      await tx.question_answers.create({
        data: {
          id: generateId('qa'),
          studentId: session.studentId,
          vocabularyId: answer.vocabularyId,
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect: answer.isCorrect,
          timeSpent: answer.timeSpent ?? 0, // 默认值 0，避免 null 约束错误
          answeredAt: now,
        },
      })
      // 更新会话进度
      const updated = await tx.study_records.update({
        where: { id: sessionId },
        data: {
          completedWords: { increment: 1 },
          correctCount: answer.isCorrect ? { increment: 1 } : undefined,
          wrongCount: !answer.isCorrect ? { increment: 1 } : undefined,
          totalTime: { increment: answer.timeSpent || 0 },
          lastActiveAt: now,
          updatedAt: now,
        },
      })
      // 更新正确率（在事务内，避免并发覆盖）
      const newAccuracy = updated.completedWords > 0
        ? updated.correctCount / updated.completedWords
        : 0
      await tx.study_records.update({
        where: { id: sessionId },
        data: { accuracy: newAccuracy },
      })
      return updated
    })

    return apiResponse.success({
      message: '进度已更新',
      completedWords: updatedSession.completedWords,
      correctCount: updatedSession.correctCount,
      wrongCount: updatedSession.wrongCount,
      totalTime: updatedSession.totalTime,
    })
  } catch (error: any) {
    console.error('更新学习进度失败:', error)
    return apiResponse.error(`更新学习进度失败: ${error?.message || '未知错误'}`)
  }
}

// POST /api/study-sessions/:id/progress - 批量同步进度（离线恢复）
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { id: sessionId } = await params
    const { answers } = await request.json()

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return apiResponse.error('参数错误：需要 answers 数组', 400)
    }

    const now = new Date()

    // 查找会话
    const session = await prisma.study_records.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return apiResponse.error('学习会话不存在', 404)
    }

    // 获取已存在的答题记录（用于去重）
    const existingAnswers = await prisma.question_answers.findMany({
      where: {
        studentId: session.studentId,
        answeredAt: { gte: session.startedAt },
      },
      select: {
        vocabularyId: true,
        questionId: true,
      },
    })

    const existingSet = new Set(
      existingAnswers.map(a => `${a.vocabularyId}_${a.questionId}`)
    )

    // 过滤出新的答题记录
    const newAnswers = answers.filter(
      (a: any) => !existingSet.has(`${a.vocabularyId}_${a.questionId}`)
    )

    if (newAnswers.length === 0) {
      return apiResponse.success({
        message: '所有答题记录已存在（无需同步）',
        synced: 0,
        completedWords: session.completedWords,
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
      })
    }

    // 批量创建答题记录
    const qaData = newAnswers.map((a: any, i: number) => ({
      id: generateId('qa'),
      studentId: session.studentId,
      vocabularyId: a.vocabularyId,
      questionId: a.questionId,
      answer: a.answer,
      isCorrect: a.isCorrect,
      timeSpent: a.timeSpent ?? 0, // 默认值 0，避免 null 约束错误
      answeredAt: now,
    }))

    await prisma.question_answers.createMany({ data: qaData })

    // 计算新的统计数据
    const newCorrectCount = newAnswers.filter((a: any) => a.isCorrect).length
    const newWrongCount = newAnswers.length - newCorrectCount
    const newTotalTime = newAnswers.reduce((sum: number, a: any) => sum + (a.timeSpent || 0), 0)

    // 更新会话
    const updatedSession = await prisma.study_records.update({
      where: { id: sessionId },
      data: {
        completedWords: { increment: newAnswers.length },
        correctCount: { increment: newCorrectCount },
        wrongCount: { increment: newWrongCount },
        totalTime: { increment: newTotalTime },
        lastActiveAt: now,
        updatedAt: now,
      },
    })

    // 更新正确率
    const newAccuracy = updatedSession.completedWords > 0
      ? updatedSession.correctCount / updatedSession.completedWords
      : 0

    await prisma.study_records.update({
      where: { id: sessionId },
      data: { accuracy: newAccuracy },
    })

    return apiResponse.success({
      message: `已同步 ${newAnswers.length} 条答题记录`,
      synced: newAnswers.length,
      completedWords: updatedSession.completedWords,
      correctCount: updatedSession.correctCount,
      wrongCount: updatedSession.wrongCount,
      totalTime: updatedSession.totalTime,
    })
  } catch (error: any) {
    console.error('批量同步进度失败:', error)
    return apiResponse.error(`批量同步进度失败: ${error?.message || '未知错误'}`)
  }
}
