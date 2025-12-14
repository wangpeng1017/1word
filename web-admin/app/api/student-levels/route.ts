import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

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
    const classId = searchParams.get('classId') || ''
    const sortBy = searchParams.get('sortBy') || 'level'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 构建查询条件
    const where: any = {}

    if (search) {
      where.student = {
        OR: [
          { user: { name: { contains: search } } },
          { studentNo: { contains: search } }
        ]
      }
    }

    if (classId) {
      where.student = {
        ...where.student,
        classId
      }
    }

    // 获取总数
    const total = await prisma.student_points.count({ where })

    // 构建排序
    const orderBy: any = {}
    if (sortBy === 'level') {
      orderBy.level = sortOrder
    } else if (sortBy === 'totalPoints') {
      orderBy.totalPoints = sortOrder
    } else if (sortBy === 'dailyPoints') {
      orderBy.dailyPoints = sortOrder
    } else if (sortBy === 'weeklyPoints') {
      orderBy.weeklyPoints = sortOrder
    } else if (sortBy === 'monthlyPoints') {
      orderBy.monthlyPoints = sortOrder
    }

    // 获取数据
    const data = await prisma.student_points.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            class: {
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

    // 格式化数据
    const formattedData = data.map(item => ({
      id: item.id,
      studentId: item.studentId,
      studentName: item.student?.user?.name || '未知',
      studentNo: item.student?.studentNo || '-',
      className: item.student?.class?.name || '未分配',
      level: item.level,
      totalPoints: item.totalPoints,
      dailyPoints: item.dailyPoints,
      weeklyPoints: item.weeklyPoints,
      monthlyPoints: item.monthlyPoints,
      updatedAt: item.updatedAt
    }))

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
