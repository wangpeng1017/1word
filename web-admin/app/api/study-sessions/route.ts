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

    const { studentId, totalWords, vocabularyIds, mode, day } = await request.json()
    if (!studentId || !totalWords) {
      return apiResponse.error('参数错误：需要 studentId 和 totalWords', 400)
    }

    const now = new Date()
    const todayUTC = getTodayUTC()

    // 检查今天是否已有会话（排除错题重测记录，按创建时间倒序）
    const existingSession = await prisma.study_records.findFirst({
      where: {
        studentId,
        taskDate: todayUTC,
        isRetestMode: false, // 排除错题重测记录
      },
      orderBy: { createdAt: 'desc' },
    })

    if (existingSession) {
      // 检查会话上下文是否匹配（通过解析 ID）
      // ID格式：sr_{timestamp}_{random}_m{mode}_d{day}
      const parts = existingSession.id.split('_')
      let sessionMode = 'unknown'
      let sessionDay = 'unknown'

      // 尝试解析 ID 中的 tag（只取第一个匹配，防止随机后缀覆盖）
      for (const part of parts) {
        if (sessionMode === 'unknown' && part.startsWith('m') && part.length > 1) sessionMode = part.substring(1)
        if (sessionDay === 'unknown' && part.startsWith('d') && part.length > 1) sessionDay = part.substring(1)
      }

      // 当前请求的 tag
      const reqMode = mode || 'unknown'
      const reqDay = day ? String(day) : 'unknown'

      // 判断是否匹配
      // 策略：信任前端传入的参数。
      // 1. 如果ID中有 tag，必须与请求参数完全匹配。
      // 2. 如果ID中没有 tag（旧数据），回退到 totalWords 判断。

      let isContextMatch = true
      const hasTags = sessionMode !== 'unknown' || (sessionDay !== 'unknown' && sessionDay !== 'null')

      if (hasTags) {
        // ID 中有 tag，必须完全匹配
        const sessionDayStr = sessionDay === 'null' ? 'unknown' : sessionDay
        const reqDayStr = (reqDay === 'null' || !reqDay) ? 'unknown' : reqDay

        // 关键修复：对于“今日新学”，请求可能是 mode=new, day=undefined。
        // 而 ID 可能只包含 mnew，没有 dTag。
        // 或者生成的 ID 是 mnew_dnull。
        // 我们需要统一标准。

        isContextMatch = (sessionMode === reqMode && sessionDayStr === reqDayStr)
      } else {
        // 旧会话没有 tag，回退到 totalWords 判断
        isContextMatch = (existingSession.totalWords === totalWords)
      }

      console.log(`[Session Check] ID=${existingSession.id} Mode=${sessionMode} Day=${sessionDay} | Req: Mode=${reqMode} Day=${reqDay} | Match=${isContextMatch}`)

      if (isContextMatch) {
        // 上下文匹配，检查状态

        // 1. 如果是进行中，恢复会话（断点续传）
        if (existingSession.status === 'IN_PROGRESS') {
          // 如果请求的总单词数大于当前会话的总单词数，更新总数（扩容）
          if (totalWords > existingSession.totalWords) {
            console.log(`[Session Update] Updating totalWords from ${existingSession.totalWords} to ${totalWords}`)
            await prisma.study_records.update({
              where: { id: existingSession.id },
              data: { totalWords },
            })
            existingSession.totalWords = totalWords
          }

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

        // 2. 如果是 INTERRUPTED，恢复为进行中
        if (existingSession.status === 'INTERRUPTED') {
          await prisma.study_records.update({
            where: { id: existingSession.id },
            data: { status: 'IN_PROGRESS', lastActiveAt: now, updatedAt: now },
          })
          return apiResponse.success({
            sessionId: existingSession.id,
            isResumed: true,
            completedWords: existingSession.completedWords,
            correctCount: existingSession.correctCount,
            wrongCount: existingSession.wrongCount,
            totalTime: existingSession.totalTime,
            message: '恢复中断的学习会话',
          })
        }

        // 3. 如果已完成，返回已完成标记（防止重复学习）
        if (existingSession.status === 'COMPLETED' || existingSession.status === 'COMPLETED_NEW' || existingSession.status === 'COMPLETED_REVIEW') {
          return apiResponse.success({
            sessionId: existingSession.id,
            isCompleted: true,
            message: '该学习任务已完成',
          })
        }
      }

      // 4. 其他情况（上下文不匹配），直接创建新会话
    }

    // 创建新会话 - 加上 Context Tag
    // 格式：sr_{timestamp}_m{mode}_d{day}_{random}
    // 确保 tag 清晰：
    // mode=new, day=1 -> mnew_d1
    // mode=new, day=null -> mnew_dnull
    const tagMode = mode || 'unknown'
    const tagDay = day ? String(day) : 'null'
    const tag = `m${tagMode}_d${tagDay}`

    const sessionId = `sr_${Date.now()}_${tag}_${Math.random().toString(36).slice(2, 6)}`

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
        completedAt: new Date('2099-01-01'), // DB字段NOT NULL，用占位值，complete时再更新
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

    // 查找今天进行中的会话（排除错题重测记录）
    const session = await prisma.study_records.findFirst({
      where: {
        studentId,
        taskDate: todayUTC,
        status: 'IN_PROGRESS',
        isRetestMode: false, // 排除错题重测记录
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
