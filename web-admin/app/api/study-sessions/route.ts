/**
 * @file 学习会话 API
 * @desc 管理学习会话的创建、查询
 * - POST: 开始学习时创建会话
 * - GET: 获取当前进行中的会话
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { getTodayUTC } from '@/lib/date-utils'

// POST /api/study-sessions - 创建学习会话（开始学习时调用）
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { studentId, totalWords, vocabularyIds } = await request.json()
    if (!studentId || !totalWords) {
      return apiResponse.error('参数错误：需要 studentId 和 totalWords', 400)
    }

    const now = new Date()
    const todayUTC = getTodayUTC()

    // 检查今天是否已有进行中的会话
    const existingSession = await prisma.study_records.findFirst({
      where: {
        studentId,
        taskDate: todayUTC,
        status: 'IN_PROGRESS',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (existingSession) {
      // 返回已有的会话，让客户端恢复
      return apiResponse.success({
        sessionId: existingSession.id,
        isResumed: true,
        completedWords: existingSession.completedWords,
        correctCount: existingSession.correctCount,
        wrongCount: existingSession.wrongCount,
        totalTime: existingSession.totalTime,
        message: '恢复已有学习会话',
      })
    }

    // 创建新会话
    const sessionId = `sr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    const session = await prisma.study_records.create({
      data: {
        id: sessionId,
        studentId,
        taskDate: todayUTC,
        totalWords,
        completedWords: 0,
        correctCount: 0,
        wrongCount: 0,
        accuracy: 0,
        totalTime: 0,
        startedAt: now,
        isCompleted: false,
        status: 'IN_PROGRESS',
        lastActiveAt: now,
        updatedAt: now,
      },
    })

    return apiResponse.success({
      sessionId: session.id,
      isResumed: false,
      message: '学习会话已创建',
    })
  } catch (error: any) {
    console.error('创建学习会话失败:', error)
    return apiResponse.error(`创建学习会话失败: ${error?.message || '未知错误'}`)
  }
}

// GET /api/study-sessions - 获取当前进行中的会话
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return apiResponse.error('缺少 studentId 参数', 400)
    }

    const todayUTC = getTodayUTC()

    // 查找今天进行中的会话
    const session = await prisma.study_records.findFirst({
      where: {
        studentId,
        taskDate: todayUTC,
        status: 'IN_PROGRESS',
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!session) {
      return apiResponse.success(null)
    }

    // 获取该会话已答的题目
    const answers = await prisma.question_answers.findMany({
      where: {
        studentId,
        answeredAt: {
          gte: session.startedAt,
        },
      },
      select: {
        vocabularyId: true,
        questionId: true,
        isCorrect: true,
        timeSpent: true,
      },
      orderBy: { answeredAt: 'asc' },
    })

    return apiResponse.success({
      sessionId: session.id,
      totalWords: session.totalWords,
      completedWords: session.completedWords,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      totalTime: session.totalTime,
      startedAt: session.startedAt,
      answers,
    })
  } catch (error: any) {
    console.error('获取学习会话失败:', error)
    return apiResponse.error(`获取学习会话失败: ${error?.message || '未知错误'}`)
  }
}
