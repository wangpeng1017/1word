import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayDate, shouldReviewToday } from '@/lib/ebbinghaus'

// 小程序字段统一工具：将蛇形字段转换为驼峰，补充 vocabulary 包裹层
function toCamelVocabulary(v: any) {
  if (!v) return null
  const questions = (v.questions || []).map((q: any) => ({
    id: q.id,
    type: q.type,
    content: q.content,
    sentence: q.sentence,
    audioUrl: q.audioUrl,
    correctAnswer: q.correctAnswer,
    options: (q.question_options || q.options || [])
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((o: any) => ({ id: o.id, content: o.content, isCorrect: o.isCorrect, order: o.order })),
  }))
  return {
    id: v.id,
    word: v.word,
    primaryMeaning: v.primaryMeaning ?? v.primary_meaning,
    secondaryMeaning: v.secondaryMeaning ?? v.secondary_meaning,
    audioUrl: v.audioUrl ?? v.audio_url,
    difficulty: v.difficulty,
    isHighFrequency: v.isHighFrequency ?? v.is_high_frequency,
    questions,
  }
}

/**
 * 获取学生的复习计划和学习进度
 * GET /api/review-plan/[studentId]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { studentId } = params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const targetDate = date ? new Date(date) : getTodayDate()

    // 1. 获取学生信息
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        classes: {
          select: {
            name: true,
            grade: true,
          },
        },
      },
    })

    if (!student) {
      return errorResponse('学生不存在', 404)
    }

    // 2. 获取今日任务
    const todayTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId,
        taskDate: targetDate,
      },
      include: {
        vocabularies: {
          include: {
            questions: {
              include: {
                question_options: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // 3. 获取学习计划统计
    const studyPlans = await prisma.study_plans.findMany({
      where: { studentId },
    })

    const totalWords = studyPlans.length
    const masteredWords = studyPlans.filter(p => p.status === 'MASTERED').length
    const inProgressWords = studyPlans.filter(p => p.status === 'IN_PROGRESS').length
    const pendingWords = studyPlans.filter(p => p.status === 'PENDING').length

    // 4. 获取需要复习的词汇（下次复习日期<=今天）；用于小程序概览的 dueCount 计算（不依赖已生成的每日任务）
    const needReview = studyPlans.filter(plan => {
      if (!plan.nextReviewAt || plan.status === 'MASTERED') return false
      return shouldReviewToday(plan.nextReviewAt, targetDate)
    }).length

    // 5. 获取掌握度统计
    const wordMasteries = await prisma.word_masteries.findMany({
      where: { studentId },
    })

    const difficultWords = wordMasteries.filter(m => m.isDifficult).length
    const avgAccuracy = wordMasteries.length > 0
      ? wordMasteries.reduce((sum, m) => sum + (m.recentAccuracy || 0), 0) / wordMasteries.length
      : 0

    // 6. 获取最近7天的学习记录
    const sevenDaysAgo = new Date(targetDate)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentStudyRecords = await prisma.study_records.findMany({
      where: {
        studentId,
        taskDate: {
          gte: sevenDaysAgo,
          lte: targetDate,
        },
      },
      orderBy: { taskDate: 'asc' },
    })

    // 7. 计算连续学习天数
    let consecutiveDays = 0
    const today = getTodayDate()
    let checkDate = new Date(today)
    
    while (true) {
      const record = await prisma.study_records.findFirst({
        where: {
          studentId,
          taskDate: checkDate,
          isCompleted: true,
        },
      })
      
      if (record) {
        consecutiveDays++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
      
      if (consecutiveDays >= 365) break // 最多查询一年
    }

    // 小程序友好的结构（不破坏原有字段）：
    const miniapp = {
      student: {
        id: student.id,
        name: student.user.name,
        studentNo: student.student_no,
        grade: student.grade,
        className: student.classes?.name || '-',
      },
      today: {
        // 即使未生成每日任务，也以需复习的计划数作为应复习数
        dueCount: Math.max(needReview, todayTasks.length),
        completedCount: todayTasks.filter(t => t.status === 'COMPLETED').length,
        pendingCount: todayTasks.filter(t => t.status === 'PENDING').length,
        tasks: todayTasks.map(t => ({
          id: t.id,
          status: t.status,
          vocabulary: toCamelVocabulary(t.vocabularies),
        })),
      },
      progress: {
        totalWords,
        masteredWords,
        inProgressWords,
        pendingWords,
        needReview,
        difficultWords,
        masteryRate: totalWords > 0 ? Number(((masteredWords / totalWords) * 100).toFixed(1)) : 0,
        avgAccuracy: Number((avgAccuracy * 100).toFixed(1)),
        consecutiveDays,
      },
      recent: recentStudyRecords.map(r => ({
        date: r.taskDate,
        completed: r.completedWords,
        total: r.totalWords,
        accuracy: Number((r.accuracy * 100).toFixed(1)),
        timeSpent: r.totalTime,
      })),
    }

    return successResponse({
      // 兼容原响应
      students: {
        id: student.id,
        name: student.user.name,
        studentNo: student.student_no,
        grade: student.grade,
        className: student.classes?.name || '-',
      },
      todayTasks: {
        total: todayTasks.length,
        completed: todayTasks.filter(t => t.status === 'COMPLETED').length,
        pending: todayTasks.filter(t => t.status === 'PENDING').length,
        tasks: todayTasks.map(t => ({
          id: t.id,
          word: t.vocabularies.word,
          primaryMeaning: (t.vocabularies as any).primary_meaning ?? (t.vocabularies as any).primaryMeaning,
          difficulty: t.vocabularies.difficulty,
          status: t.status,
        })),
      },
      progress: {
        totalWords,
        masteredWords,
        inProgressWords,
        pendingWords,
        needReview,
        difficultWords,
        masteryRate: totalWords > 0 ? (masteredWords / totalWords * 100).toFixed(1) : 0,
        avgAccuracy: (avgAccuracy * 100).toFixed(1),
        consecutiveDays,
      },
      recentActivity: recentStudyRecords.map(r => ({
        date: r.taskDate,
        completed: r.completedWords,
        total: r.totalWords,
        accuracy: (r.accuracy * 100).toFixed(1),
        timeSpent: r.totalTime,
      })),
      // 新增：小程序友好的 overview
      miniapp,
    })
  } catch (error) {
    console.error('获取复习计划错误:', error)
    return errorResponse('获取复习计划失败', 500)
  }
}
