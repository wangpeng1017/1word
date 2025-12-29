import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// 获取今日、本周、本月的起始时间
function getTimeRanges() {
  const now = new Date()

  // 今日开始（UTC 0点）
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  // 本周开始（周一 UTC 0点）
  const dayOfWeek = now.getUTCDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(todayStart)
  weekStart.setUTCDate(weekStart.getUTCDate() - daysToMonday)

  // 本月开始（1号 UTC 0点）
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  return { todayStart, weekStart, monthStart }
}

// GET /api/student-levels - 获取所有学生的等级数据
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
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const class_id = searchParams.get('class_id') || ''
    const sortBy = searchParams.get('sortBy') || 'level'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 构建查询条件
    const where: any = {}

    if (search) {
      where.students = {
        OR: [
          { user: { name: { contains: search } } },
          { student_no: { contains: search } }
        ]
      }
    }

    if (class_id) {
      where.students = {
        ...where.student,
        class_id
      }
    }

    // 获取总数
    const total = await prisma.student_points.count({ where })

    // 构建排序（只支持 level 和 totalPoints 的数据库排序）
    const orderBy: any = {}
    if (sortBy === 'level') {
      orderBy.level = sortOrder
    } else if (sortBy === 'totalPoints') {
      orderBy.totalPoints = sortOrder
    } else {
      orderBy.level = sortOrder
    }

    // 获取数据
    const data = await prisma.student_points.findMany({
      where,
      include: {
        students: {
          include: {
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
      },
      orderBy: Object.keys(orderBy).length > 0 ? orderBy : { level: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // 获取时间范围
    const { todayStart, weekStart, monthStart } = getTimeRanges()
    const studentIds = data.map(d => d.studentId)

    // 从 point_history 动态计算今日/本周/本月积分
    const pointsAggregation = await prisma.point_history.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: monthStart } // 只查本月内的数据
      },
      _sum: { points: true }
    })

    // 今日积分
    const dailyPointsAgg = await prisma.point_history.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: todayStart }
      },
      _sum: { points: true }
    })

    // 本周积分
    const weeklyPointsAgg = await prisma.point_history.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: weekStart }
      },
      _sum: { points: true }
    })

    // 本月积分
    const monthlyPointsAgg = await prisma.point_history.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: monthStart }
      },
      _sum: { points: true }
    })

    // 转换为 Map
    const dailyMap = new Map(dailyPointsAgg.map(p => [p.studentId, p._sum.points || 0]))
    const weeklyMap = new Map(weeklyPointsAgg.map(p => [p.studentId, p._sum.points || 0]))
    const monthlyMap = new Map(monthlyPointsAgg.map(p => [p.studentId, p._sum.points || 0]))

    // 格式化数据
    const formattedData = data.map(item => ({
      id: item.id,
      studentId: item.studentId,
      studentName: item.students?.user?.name || '未知',
      studentNo: item.students?.student_no || '-',
      className: item.students?.classes?.name || '未分配',
      level: item.level,
      totalPoints: item.totalPoints,
      dailyPoints: dailyMap.get(item.studentId) || 0,
      weeklyPoints: weeklyMap.get(item.studentId) || 0,
      monthlyPoints: monthlyMap.get(item.studentId) || 0,
      updatedAt: item.updatedAt
    }))

    // 如果按今日/本周/本月积分排序，需要在内存中排序
    if (sortBy === 'dailyPoints' || sortBy === 'weeklyPoints' || sortBy === 'monthlyPoints') {
      formattedData.sort((a, b) => {
        const aVal = a[sortBy as keyof typeof a] as number
        const bVal = b[sortBy as keyof typeof b] as number
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
      })
    }

    // 获取等级分布统计
    const levelStats = await prisma.student_points.groupBy({
      by: ['level'],
      _count: { level: true },
      orderBy: { level: 'asc' }
    })

    return apiResponse.success({
      list: formattedData,
      total,
      page,
      pageSize,
      levelStats: levelStats.map(s => ({
        level: s.level,
        count: s._count.level
      }))
    })
  } catch (error: any) {
    console.error('获取等级数据失败:', error)
    return apiResponse.error(`获取等级数据失败: ${error?.message || '未知错误'}`)
  }
}
