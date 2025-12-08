import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/points - 获取学生积分信息
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
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return apiResponse.error('缺少studentId参数', 400)
    }

    // 获取或创建积分记录
    let points = await prisma.student_points.findUnique({
      where: { studentId }
    })

    if (!points) {
      // 创建初始积分记录
      const pointsId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      points = await prisma.student_points.create({
        data: {
          id: pointsId,
          studentId,
          totalPoints: 0,
          dailyPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          level: 1,
          updatedAt: new Date()
        }
      })
    }

    // 获取积分历史（最近10条）
    const history = await prisma.point_history.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return apiResponse.success({
      points,
      history
    })
  } catch (error: any) {
    console.error('获取积分信息失败:', error)
    return apiResponse.error(`获取积分信息失败: ${error?.message || '未知错误'}`)
  }
}

// POST /api/points - 添加积分
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const body = await request.json()
    const {
      studentId,
      points,
      reason,
      relatedType,
      relatedId
    } = body

    if (!studentId || points === undefined) {
      return apiResponse.error('参数错误：studentId和points为必填项', 400)
    }

    // 获取或创建积分记录
    let studentPoints = await prisma.student_points.findUnique({
      where: { studentId }
    })

    if (!studentPoints) {
      const pointsId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      studentPoints = await prisma.student_points.create({
        data: {
          id: pointsId,
          studentId,
          totalPoints: 0,
          dailyPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          level: 1,
          updatedAt: new Date()
        }
      })
    }

    // 更新积分
    const newTotalPoints = studentPoints.totalPoints + points
    const newDailyPoints = studentPoints.dailyPoints + points
    const newWeeklyPoints = studentPoints.weeklyPoints + points
    const newMonthlyPoints = studentPoints.monthlyPoints + points

    // 计算等级（每100积分升1级）
    const newLevel = Math.floor(newTotalPoints / 100) + 1

    const updatedPoints = await prisma.student_points.update({
      where: { studentId },
      data: {
        totalPoints: newTotalPoints,
        dailyPoints: newDailyPoints,
        weeklyPoints: newWeeklyPoints,
        monthlyPoints: newMonthlyPoints,
        level: newLevel,
        updatedAt: new Date()
      }
    })

    // 记录积分历史
    const historyId = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    await prisma.point_history.create({
      data: {
        id: historyId,
        studentId,
        points,
        reason: reason || '积分变动',
        relatedType,
        relatedId
      }
    })

    return apiResponse.success({
      message: '积分添加成功',
      points: updatedPoints
    })
  } catch (error: any) {
    console.error('添加积分失败:', error)
    return apiResponse.error(`添加积分失败: ${error?.message || '未知错误'}`)
  }
}
