import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/leaderboard - 获取排行榜
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'total' // total, daily, weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '50')
    const classId = searchParams.get('classId') // 可选：按班级筛选

    // 构建查询条件
    const where: any = {}
    if (classId) {
      where.students = {
        class_id: classId
      }
    }

    // 根据类型选择排序字段
    let orderByField: 'totalPoints' | 'dailyPoints' | 'weeklyPoints' | 'monthlyPoints' = 'totalPoints'
    switch (type) {
      case 'daily':
        orderByField = 'dailyPoints'
        break
      case 'weekly':
        orderByField = 'weeklyPoints'
        break
      case 'monthly':
        orderByField = 'monthlyPoints'
        break
      default:
        orderByField = 'totalPoints'
    }

    // 获取排行榜数据
    const leaderboard = await prisma.student_points.findMany({
      where,
      orderBy: { [orderByField]: 'desc' },
      take: limit,
      include: {
        students: {
          select: {
            id: true,
            student_no: true,
            grade: true,
            user: {
              select: {
                name: true
              }
            },
            classes: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // 添加排名
    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      studentId: item.studentId,
      studentName: item.students.user.name,
      studentNo: item.students.student_no,
      grade: item.students.grade,
      className: item.students.classes.name,
      points: item[orderByField],
      level: item.level,
      totalPoints: item.totalPoints
    }))

    return apiResponse.success({
      type,
      leaderboard: rankedLeaderboard
    })
  } catch (error: any) {
    console.error('获取排行榜失败:', error)
    return apiResponse.error(`获取排行榜失败: ${error?.message || '未知错误'}`)
  }
}
