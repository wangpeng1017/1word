import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { getTodayDate } from '@/lib/ebbinghaus'

/**
 * 获取学生排名
 * GET /api/statistics/rankings?type=mastery|accuracy|progress&classId=xxx&limit=50
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
    const type = searchParams.get('type') || 'mastery'
    const classId = searchParams.get('classId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // 构建筛选条件
    const studentFilter = classId ? { classId } : {}

    // 获取所有学生基本信息
    const students = await prisma.students.findMany({
      where: studentFilter,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        classes: {
          select: {
            name: true,
          },
        },
      },
    })

    // 根据排名类型获取不同数据
    let rankings: any[] = []

    switch (type) {
      case 'mastery': {
        // 掌握词汇数量排行
        const masteryStats = await Promise.all(
          students.map(async (student) => {
            const wordMasteries = await prisma.word_masteries.findMany({
              where: { studentId: student.id },
            })
            
            const masteredCount = wordMasteries.filter(m => m.isMastered).length
            const totalLearning = wordMasteries.length
            const masteryRate = totalLearning > 0 
              ? (masteredCount / totalLearning * 100)
              : 0

            return {
              studentId: student.id,
              studentName: student.user.name,
              studentNo: student.studentNo,
              className: student.classes.name,
              masteredCount,
              totalLearning,
              masteryRate: masteryRate.toFixed(1),
              score: masteredCount, // 用于排序
            }
          })
        )

        rankings = masteryStats
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((item, index) => ({ ...item, rank: index + 1 }))
        break
      }

      case 'accuracy': {
        // 正确率排行
        const today = getTodayDate()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const accuracyStats = await Promise.all(
          students.map(async (student) => {
            const studyRecords = await prisma.study_records.findMany({
              where: {
                studentId: student.id,
                taskDate: {
                  gte: thirtyDaysAgo,
                },
              },
            })

            const totalCorrect = studyRecords.reduce((sum, r) => sum + r.correctCount, 0)
            const totalWrong = studyRecords.reduce((sum, r) => sum + r.wrongCount, 0)
            const totalAnswered = totalCorrect + totalWrong
            const accuracy = totalAnswered > 0 
              ? (totalCorrect / totalAnswered * 100)
              : 0

            return {
              studentId: student.id,
              studentName: student.user.name,
              studentNo: student.studentNo,
              className: student.classes.name,
              totalAnswered,
              totalCorrect,
              totalWrong,
              accuracy: accuracy.toFixed(1),
              score: accuracy, // 用于排序
            }
          })
        )

        rankings = accuracyStats
          .filter(item => item.totalAnswered > 0) // 过滤没有答题的学生
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((item, index) => ({ ...item, rank: index + 1 }))
        break
      }

      case 'progress': {
        // 学习进步排行（最近7天相比之前7天）
        const today = getTodayDate()
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const fourteenDaysAgo = new Date(today)
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

        const progressStats = await Promise.all(
          students.map(async (student) => {
            // 最近7天
            const recentRecords = await prisma.study_records.findMany({
              where: {
                studentId: student.id,
                taskDate: {
                  gte: sevenDaysAgo,
                  lte: today,
                },
              },
            })

            // 之前7天
            const previousRecords = await prisma.study_records.findMany({
              where: {
                studentId: student.id,
                taskDate: {
                  gte: fourteenDaysAgo,
                  lt: sevenDaysAgo,
                },
              },
            })

            const recentCorrect = recentRecords.reduce((sum, r) => sum + r.correctCount, 0)
            const recentTotal = recentRecords.reduce((sum, r) => sum + r.correctCount + r.wrongCount, 0)
            const recentAccuracy = recentTotal > 0 ? (recentCorrect / recentTotal * 100) : 0

            const previousCorrect = previousRecords.reduce((sum, r) => sum + r.correctCount, 0)
            const previousTotal = previousRecords.reduce((sum, r) => sum + r.correctCount + r.wrongCount, 0)
            const previousAccuracy = previousTotal > 0 ? (previousCorrect / previousTotal * 100) : 0

            const improvement = recentAccuracy - previousAccuracy

            return {
              studentId: student.id,
              studentName: student.user.name,
              studentNo: student.studentNo,
              className: student.classes.name,
              recentAccuracy: recentAccuracy.toFixed(1),
              previousAccuracy: previousAccuracy.toFixed(1),
              improvement: improvement.toFixed(1),
              score: improvement, // 用于排序
            }
          })
        )

        rankings = progressStats
          .filter(item => parseFloat(item.previousAccuracy) > 0) // 过滤没有对比数据的
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((item, index) => ({ ...item, rank: index + 1 }))
        break
      }

      case 'streak': {
        // 连续学习天数排行
        const streakStats = await Promise.all(
          students.map(async (student) => {
            let consecutiveDays = 0
            const today = getTodayDate()
            let checkDate = new Date(today)
            
            while (consecutiveDays < 365) {
              const record = await prisma.study_records.findFirst({
                where: {
                  studentId: student.id,
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
            }

            // 总学习天数
            const totalDays = await prisma.study_records.count({
              where: {
                studentId: student.id,
                isCompleted: true,
              },
            })

            return {
              studentId: student.id,
              studentName: student.user.name,
              studentNo: student.studentNo,
              className: student.classes.name,
              consecutiveDays,
              totalDays,
              score: consecutiveDays, // 用于排序
            }
          })
        )

        rankings = streakStats
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((item, index) => ({ ...item, rank: index + 1 }))
        break
      }

      default:
        return errorResponse('无效的排名类型')
    }

    return successResponse({
      type,
      rankings,
      total: rankings.length,
    })
  } catch (error) {
    console.error('获取排名错误:', error)
    return errorResponse('获取排名失败', 500)
  }
}
