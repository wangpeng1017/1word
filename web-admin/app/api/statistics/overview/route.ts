import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayDate } from '@/lib/ebbinghaus'

/**
 * 获取统计总览数据
 * GET /api/statistics/overview?startDate=xxx&endDate=xxx&classId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以查看统计数据')
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const classId = searchParams.get('classId')

    // 设置默认日期范围（最近30天）
    const today = getTodayDate()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dateRangeStart = startDate ? new Date(startDate) : thirtyDaysAgo
    const dateRangeEnd = endDate ? new Date(endDate) : today

    // 构建筛选条件
    const studentFilter = classId ? { classId } : {}

    // 1. 学生总数统计
    const totalStudents = await prisma.students.count({
      where: studentFilter,
    })

    // 2. 词汇总数
    const totalVocabularies = await prisma.vocabularies.count()

    // 3. 学习记录统计
    const studyRecords = await prisma.study_records.findMany({
      where: {
        student: studentFilter,
        taskDate: {
          gte: dateRangeStart,
          lte: dateRangeEnd,
        },
      },
    })

    const totalSessions = studyRecords.length
    const completedSessions = studyRecords.filter(r => r.isCompleted).length
    const totalWords = studyRecords.reduce((sum, r) => sum + r.completedWords, 0)
    const totalCorrect = studyRecords.reduce((sum, r) => sum + r.correctCount, 0)
    const totalWrong = studyRecords.reduce((sum, r) => sum + r.wrongCount, 0)
    const totalTime = studyRecords.reduce((sum, r) => sum + r.totalTime, 0)
    const avgAccuracy = totalWords > 0 ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0

    // 4. 活跃学生统计（最近7天有学习记录）
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const activeStudentIds = await prisma.study_records.findMany({
      where: {
        student: studentFilter,
        taskDate: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        studentId: true,
      },
      distinct: ['studentId'],
    })

    // 5. 掌握度统计
    const wordMasteries = await prisma.word_masteries.findMany({
      where: {
        student: studentFilter,
      },
    })

    const masteredWords = wordMasteries.filter(m => m.isMastered).length
    const difficultWords = wordMasteries.filter(m => m.isDifficult).length
    const learningWords = wordMasteries.filter(m => !m.isMastered).length

    // 6. 每日学习趋势（最近14天）
    const fourteenDaysAgo = new Date(today)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const dailyStats = await prisma.study_records.groupBy({
      by: ['taskDate'],
      where: {
        student: studentFilter,
        taskDate: {
          gte: fourteenDaysAgo,
          lte: today,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        completedWords: true,
        correctCount: true,
        wrongCount: true,
      },
    })

    const dailyTrend = dailyStats.map(stat => ({
      date: stat.taskDate,
      sessions: stat._count.id,
      words: stat._sum.completedWords || 0,
      correct: stat._sum.correctCount || 0,
      wrong: stat._sum.wrongCount || 0,
      accuracy: stat._sum.completedWords 
        ? ((stat._sum.correctCount || 0) / ((stat._sum.correctCount || 0) + (stat._sum.wrongCount || 0)) * 100).toFixed(1)
        : 0,
    }))

    // 7. 错题统计
    const wrongQuestions = await prisma.wrong_questions.findMany({
      where: {
        student: studentFilter,
        wrongAt: {
          gte: dateRangeStart,
          lte: dateRangeEnd,
        },
      },
      include: {
        vocabularies: {
          select: {
            word: true,
            primaryMeaning: true,
            difficulty: true,
          },
        },
      },
    })

    // 按单词分组统计错误次数
    const wrongWordsMap = new Map<string, any>()
    wrongQuestions.forEach(wq => {
      const word = wq.vocabularies.word
      if (wrongWordsMap.has(word)) {
        wrongWordsMap.get(word).count++
      } else {
        wrongWordsMap.set(word, {
          word,
          meaning: wq.vocabularies.primaryMeaning,
          difficulty: wq.vocabularies.difficulty,
          count: 1,
        })
      }
    })

    const topWrongWords = Array.from(wrongWordsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    return successResponse({
      overview: {
        totalStudents,
        activeStudents: activeStudentIds.length,
        totalVocabularies,
        totalSessions,
        completedSessions,
        totalWords,
        avgAccuracy: avgAccuracy.toFixed(1),
        totalTime: Math.floor(totalTime / 60), // 转换为分钟
      },
      mastery: {
        masteredWords,
        learningWords,
        difficultWords,
        masteryRate: wordMasteries.length > 0 
          ? ((masteredWords / wordMasteries.length) * 100).toFixed(1)
          : 0,
      },
      dailyTrend,
      topWrongWords,
      dateRange: {
        start: dateRangeStart,
        end: dateRangeEnd,
      },
    })
  } catch (error) {
    console.error('获取统计总览错误:', error)
    return errorResponse('获取统计总览失败', 500)
  }
}
