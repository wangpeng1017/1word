import { NextRequest } from 'next/server'
import { prismaRead } from '@/lib/prisma'
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
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以查看统计数据')
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
    const studentFilter = classId ? { class_id: classId } : {}

    // 1. 学生总数统计
    const totalStudents = await prismaRead.students.count({
      where: studentFilter,
    })

    // 2. 词汇总数
    const totalVocabularies = await prismaRead.vocabularies.count()

    // 3. 学习记录统计
    const studyRecords = await prismaRead.study_records.findMany({
      where: {
        students: Object.keys(studentFilter).length ? { ...studentFilter } : undefined,
        taskDate: {
          gte: dateRangeStart,
          lte: dateRangeEnd,
        },
      },
    })

    const totalSessions = studyRecords.length
    const completedSessions = studyRecords.filter(r => r.isCompleted).length
    const totalWordsLearned = studyRecords.reduce((sum, r) => sum + r.completedWords, 0)
    const totalCorrect = studyRecords.reduce((sum, r) => sum + r.correctCount, 0)
    const totalWrong = studyRecords.reduce((sum, r) => sum + r.wrongCount, 0)
    const totalTime = studyRecords.reduce((sum, r) => sum + r.totalTime, 0)
    const avgAccuracy = totalWordsLearned > 0 ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0

    // 4. 活跃学生统计（最近7天有学习记录）
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activeStudentIds = await prismaRead.study_records.findMany({
      where: {
        students: Object.keys(studentFilter).length ? { ...studentFilter } : undefined,
        taskDate: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        studentId: true,
      },
      distinct: ['studentId'],
    })

    // 4.1 今日完成学习的学生数（今天有 isCompleted=true 学习记录的独立学生数）
    const todayCompletedStudents = await prismaRead.study_records.findMany({
      where: {
        students: Object.keys(studentFilter).length ? { ...studentFilter } : undefined,
        taskDate: {
          gte: today,
          lte: today,
        },
        isCompleted: true,
      },
      select: {
        studentId: true,
      },
      distinct: ['studentId'],
    })

    // 5. 掌握度统计 - 改用人次统计（更准确）
    const wordMasteries = await prismaRead.word_masteries.findMany({
      where: {
        students: Object.keys(studentFilter).length ? { ...studentFilter } : undefined,
      },
      select: {
        vocabularyId: true,
        isMastered: true,
        isDifficult: true,
      },
    })

    // 统计人次（每个学生-词汇对为一条记录）
    const totalMasteryRecords = wordMasteries.length
    const masteredRecords = wordMasteries.filter(m => m.isMastered).length
    const difficultRecords = wordMasteries.filter(m => m.isDifficult).length
    const learningRecords = wordMasteries.filter(m => !m.isMastered).length

    // 统计独立词汇数（用于展示覆盖了多少词汇）
    const uniqueVocabIds = new Set(wordMasteries.map(m => m.vocabularyId))
    const totalLearnedVocabs = uniqueVocabIds.size

    // 6. 每日学习趋势（最近14天）
    const fourteenDaysAgo = new Date(today)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const dailyStats = await prismaRead.study_records.groupBy({
      by: ['taskDate'],
      where: {
        students: Object.keys(studentFilter).length ? { ...studentFilter } : undefined,
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
    const wrongQuestions = await prismaRead.wrong_questions.findMany({
      where: {
        students: studentFilter,
        wrongAt: {
          gte: dateRangeStart,
          lte: dateRangeEnd,
        },
      },
      include: {
        vocabularies: {
          include: {
            word_meanings: {
              where: { orderIndex: 0 },
              take: 1,
            },
          },
        },
      },
    })

    // 按单词分组统计错误次数 & 统计词性分布
    const wrongWordsMap = new Map<string, any>()
    const posStats: Record<string, number> = {}

    wrongQuestions.forEach(wq => {
      const vocab = wq.vocabularies as any
      const word = vocab.word

      // 统计错词 Top 20
      if (wrongWordsMap.has(word)) {
        wrongWordsMap.get(word).count++
      } else {
        wrongWordsMap.set(word, {
          word,
          meaning: vocab.primary_meaning,
          difficulty: vocab.difficulty,
          count: 1,
        })
      }

      // 统计词性
      let pos = 'unknown'
      if (vocab.word_meanings && vocab.word_meanings.length > 0) {
        pos = vocab.word_meanings[0].partOfSpeech
      } else if (vocab.part_of_speech && vocab.part_of_speech.length > 0) {
        pos = vocab.part_of_speech[0]
      }
      posStats[pos] = (posStats[pos] || 0) + 1
    })

    const topWrongWords = Array.from(wrongWordsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    const partOfSpeechDistribution = Object.entries(posStats)
      .map(([pos, count]) => ({ pos, count }))
      .sort((a, b) => b.count - a.count)

    return successResponse({
      overview: {
        totalStudents,
        activeStudents: activeStudentIds.length,
        todayCompletedStudents: todayCompletedStudents.length,  // 今日完成学习的学生数
        totalVocabularies,  // 词库总数
        totalSessions,
        completedSessions,
        totalWords: totalVocabularies,  // 学习总词汇 = 词库总数
        avgAccuracy: avgAccuracy.toFixed(1),
        totalTime: Math.floor(totalTime / 60), // 转换为分钟
      },
      mastery: {
        masteredCount: masteredRecords,      // 已掌握的学生-词汇对数量
        learningCount: learningRecords,      // 学习中的学生-词汇对数量
        difficultCount: difficultRecords,    // 难点词汇的学生-词汇对数量
        totalRecords: totalMasteryRecords,   // 总学习记录数
        uniqueVocabs: totalLearnedVocabs,    // 覆盖的独立词汇数
        // 掌握率 = 已掌握记录数 / 总记录数（人次维度，更准确）
        masteryRate: totalMasteryRecords > 0
          ? ((masteredRecords / totalMasteryRecords) * 100).toFixed(1)
          : 0,
      },
      dailyTrend,
      topWrongWords,
      partOfSpeechDistribution,
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
