import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import { cacheGet, cacheSet, getLeaderboard, isRedisAvailable } from '@/lib/redis'

// GET /api/leaderboard - 获取排行榜（带缓存）
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'total'
    const limit = parseInt(searchParams.get('limit') || '50')
    const classId = searchParams.get('classId')

    const cacheKey = `leaderboard:${type}:${classId || 'all'}:${limit}`

    // 1. 尝试从缓存获取
    const cached = await cacheGet<any>(cacheKey)
    if (cached) {
      return apiResponse.success({ type, leaderboard: cached, fromCache: true })
    }

    // 2. 尝试从Redis Sorted Set获取（如果可用）
    const redisAvailable = await isRedisAvailable()
    if (redisAvailable && !classId) {
      const redisKey = `lb:${type}`
      const redisData = await getLeaderboard(redisKey, 0, limit - 1)

      if (redisData.length > 0) {
        const studentIds = redisData.map(r => r.studentId)
        const students = await prisma.students.findMany({
          where: { id: { in: studentIds } },
          select: {
            id: true,
            student_no: true,
            grade: true,
            user: { select: { name: true } },
            classes: { select: { name: true } },
          }
        })

        const studentMap = new Map(students.map(s => [s.id, s]))
        const leaderboard = redisData.map(r => {
          const s = studentMap.get(r.studentId)
          return {
            rank: r.rank,
            studentId: r.studentId,
            studentName: s?.user?.name || '',
            studentNo: s?.student_no || '',
            grade: s?.grade || '',
            className: s?.classes?.name || '',
            points: r.score,
          }
        })

        await cacheSet(cacheKey, leaderboard, 60)
        return apiResponse.success({ type, leaderboard })
      }
    }

    // 3. 回退到数据库查询
    const where: any = {}
    if (classId) {
      where.students = { class_id: classId }
    }

    let orderByField: 'totalPoints' | 'dailyPoints' | 'weeklyPoints' | 'monthlyPoints' = 'totalPoints'
    switch (type) {
      case 'daily': orderByField = 'dailyPoints'; break
      case 'weekly': orderByField = 'weeklyPoints'; break
      case 'monthly': orderByField = 'monthlyPoints'; break
      default: orderByField = 'totalPoints'
    }

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
            user: { select: { name: true } },
            classes: { select: { name: true } }
          }
        }
      }
    })

    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      studentId: item.studentId,
      studentName: item.students?.user?.name || '',
      studentNo: item.students?.student_no || '',
      grade: item.students?.grade || '',
      className: item.students?.classes?.name || '',
      points: item[orderByField],
      level: item.level,
      totalPoints: item.totalPoints
    }))

    // 缓存结果60秒
    await cacheSet(cacheKey, rankedLeaderboard, 60)

    return apiResponse.success({ type, leaderboard: rankedLeaderboard })
  } catch (error: any) {
    console.error('获取排行榜失败:', error)
    return apiResponse.error(`获取排行榜失败: ${error?.message || '未知错误'}`)
  }
}
