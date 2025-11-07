import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayDate, shouldReviewToday } from '@/lib/ebbinghaus'

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
        vocabulary: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // 3. 获取学习计划统计
    const studyPlans = await prisma.study_plans.findMany({
      where: {
        studentId,
      },
    })

    const totalWords = studyPlans.length
    const masteredWords = studyPlans.filter(p => p.status === 'MASTERED').length
    const inProgressWords = studyPlans.filter(p => p.status === 'IN_PROGRESS').length
    const pendingWords = studyPlans.filter(p => p.status === 'PENDING').length

    // 4. 获取需要复习的词汇（下次复习日期<=今天）
    const needReview = studyPlans.filter(plan => {
      if (!plan.nextReviewAt || plan.status === 'MASTERED') return false
      return shouldReviewToday(plan.nextReviewAt, targetDate)
    }).length

    // 5. 获取掌握度统计
    const wordMasteries = await prisma.word_masteries.findMany({
      where: {
        studentId,
      },
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
      orderBy: {
        taskDate: 'asc',
      },
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

    return successResponse({
      students: {
        id: student.id,
        name: student.user.name,
        studentNo: student.studentNo,
        grade: student.grade,
        className: student.classes.name,
      },
      todayTasks: {
        total: todayTasks.length,
        completed: todayTasks.filter(t => t.status === 'COMPLETED').length,
        pending: todayTasks.filter(t => t.status === 'PENDING').length,
        tasks: todayTasks.map(t => ({
          id: t.id,
          word: t.vocabularies.word,
          primaryMeaning: t.vocabularies.primaryMeaning,
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
    })
  } catch (error) {
    console.error('获取复习计划错误:', error)
    return errorResponse('获取复习计划失败', 500)
  }
}
