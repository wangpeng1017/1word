import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// POST /api/achievements/unlock - 解锁成就
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
    const { studentId, achievementId } = body

    if (!studentId || !achievementId) {
      return apiResponse.error('参数错误：studentId和achievementId为必填项', 400)
    }

    // 检查成就是否存在
    const achievement = await prisma.achievements.findUnique({
      where: { id: achievementId }
    })

    if (!achievement) {
      return apiResponse.error('成就不存在', 404)
    }

    if (!achievement.isActive) {
      return apiResponse.error('该成就已停用', 400)
    }

    // 检查是否已解锁
    const existing = await prisma.student_achievements.findUnique({
      where: {
        studentId_achievementId: {
          studentId,
          achievementId
        }
      }
    })

    if (existing) {
      return apiResponse.error('该成就已解锁', 400)
    }

    // 解锁成就
    const unlockId = `sa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const studentAchievement = await prisma.student_achievements.create({
      data: {
        id: unlockId,
        studentId,
        achievementId
      }
    })

    // 如果成就有积分奖励，添加积分
    if (achievement.points > 0) {
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
      const newTotalPoints = studentPoints.totalPoints + achievement.points
      const newLevel = Math.floor(newTotalPoints / 100) + 1

      await prisma.student_points.update({
        where: { studentId },
        data: {
          totalPoints: newTotalPoints,
          dailyPoints: studentPoints.dailyPoints + achievement.points,
          weeklyPoints: studentPoints.weeklyPoints + achievement.points,
          monthlyPoints: studentPoints.monthlyPoints + achievement.points,
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
          points: achievement.points,
          reason: `解锁成就：${achievement.name}`,
          relatedType: 'achievement',
          relatedId: achievementId
        }
      })
    }

    return apiResponse.success({
      message: '成就解锁成功',
      achievement: {
        ...achievement,
        unlockedAt: studentAchievement.unlockedAt
      }
    })
  } catch (error: any) {
    console.error('解锁成就失败:', error)
    return apiResponse.error(`解锁成就失败: ${error?.message || '未知错误'}`)
  }
}
