import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import {
  shouldReviewToday,
  getTodayDate,
  daysBetween,
  calculatePriority,
} from '@/lib/ebbinghaus'

/**
 * 生成每日复习计划
 * POST /api/review-plan/generate
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { studentId, date } = body

    if (!studentId) {
      return errorResponse('缺少学生ID')
    }

    // 验证学生存在
    const student = await prisma.students.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    const targetDate = date ? new Date(date) : getTodayDate()
    
    // 1. 获取学生的所有词汇掌握情况
    const wordMasteries = await prisma.word_masteries.findMany({
      where: {
        studentId,
        isMastered: false, // 排除已掌握的词汇
      },
      include: {
        vocabularies: true,
      },
    })

    // 2. 获取学生的学习计划
    const studyPlans = await prisma.study_plans.findMany({
      where: {
        studentId,
        status: { not: 'MASTERED' },
      },
      include: {
        vocabularies: true,
      },
    })

    // 3. 筛选需要今日复习的词汇
    const reviewWords = studyPlans.filter((plan) => {
      if (!plan.nextReviewAt) return false
      return shouldReviewToday(plan.nextReviewAt, targetDate)
    })

    // 4. 计算每个词汇的优先级
    const wordsWithPriority = reviewWords.map((plan) => {
      const mastery = wordMasteries.find(m => m.vocabularyId === plan.vocabularyId)
      const daysSince = plan.lastReviewAt 
        ? daysBetween(plan.lastReviewAt, targetDate)
        : 30 // 从未复习过给个较大值
      
      const priority = calculatePriority(
        mastery?.isDifficult || false,
        daysSince,
        plan.reviewCount
      )

      return {
        ...plan,
        priority,
        mastery,
      }
    })

    // 5. 按优先级排序（返回所有需要复习的词汇，不限制数量）
    const sortedWords = wordsWithPriority.sort((a, b) => b.priority - a.priority)

    // 6. 获取所有需要复习的词汇
    const allWords = sortedWords.map(w => w.vocabularies)

    // 7. 创建每日任务
    for (const vocab of allWords) {
      await prisma.daily_tasks.upsert({
        where: {
          studentId_vocabularyId_taskDate: {
            studentId,
            vocabularyId: vocab.id,
            taskDate: targetDate,
          },
        },
        create: {
          studentId,
          vocabularyId: vocab.id,
          taskDate: targetDate,
          status: 'PENDING',
        },
        update: {
          status: 'PENDING',
        },
      })
    }

    return successResponse({
      date: targetDate,
      totalWords: allWords.length,
      words: allWords.map(w => ({
        id: w.id,
        word: w.word,
        primaryMeaning: (w as any).primary_meaning ?? (w as any).primaryMeaning ?? '',
      })),
    }, '复习计划生成成功')
  } catch (error) {
    console.error('生成复习计划错误:', error)
    return errorResponse('生成复习计划失败', 500)
  }
}
