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
    const studentFilter = classId ? { class_id: classId } : {}

    // 1. 学生总数统计
    const totalStudents = await prisma.students.count({
      where: studentFilter,
    })

    // 2. 词汇总数
    const totalVocabularies = await prisma.vocabularies.count()

    // 3. 学习记录统计
    const studyRecords = await prisma.study_records.findMany({
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

    const activeStudentIds = await prisma.study_records.findMany({
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
    const todayCompletedStudents = await prisma.study_records.findMany({
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

    // 5. 掌握度统计 - 按独立词汇统计（vocabularyId 去重）
    const wordMasteries = await prisma.word_masteries.findMany({
      where: {
        students: Object.keys(studentFilter).length ? { ...studentFilter } : undefined,
      },
      select: {
        vocabularyId: true,
        isMastered: true,
        isDifficult: true,
      },
    })

    // 按 vocabularyId 去重统计
    const vocabMasteryMap = new Map<string, { isMastered: boolean; isDifficult: boolean }>()
    wordMasteries.forEach(m => {
      const existing = vocabMasteryMap.get(m.vocabularyId)
      if (!existing) {
        // 首次遇到该词汇
        vocabMasteryMap.set(m.vocabularyId, {
          isMastered: m.isMastered,
          isDifficult: m.isDifficult
        })
      } else {
        // 如果任意学生已掌握，则标记为已掌握
        if (m.isMastered) existing.isMastered = true
        // 如果任意学生标记为难点，则标记为难点
        if (m.isDifficult) existing.isDifficult = true
      }
    })

    // 统计独立词汇数
    const uniqueVocabs = Array.from(vocabMasteryMap.values())
    const masteredWords = uniqueVocabs.filter(v => v.isMastered).length
    const difficultWords = uniqueVocabs.filter(v => v.isDifficult).length
    const learningWords = uniqueVocabs.filter(v => !v.isMastered).length
    const totalLearnedVocabs = uniqueVocabs.length  // 有学习记录的独立词汇数

    // 6. 每日学习趋势（最近14天）
    const fourteenDaysAgo = new Date(today)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const dailyStats = await prisma.study_records.groupBy({
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
    const wrongQuestions = await prisma.wrong_questions.findMany({
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
        masteredWords,
        learningWords,
        difficultWords,
        // 掌握率 = 已掌握独立词汇数 / 有学习记录的独立词汇数
        masteryRate: totalLearnedVocabs > 0
          ? ((masteredWords / totalLearnedVocabs) * 100).toFixed(1)
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
