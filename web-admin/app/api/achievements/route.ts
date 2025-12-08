import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/achievements - 获取成就列表
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
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const achievements = await prisma.achievements.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // 如果提供了studentId，获取学生的成就解锁情况
    if (studentId) {
      const unlockedAchievements = await prisma.student_achievements.findMany({
        where: { studentId },
        select: { achievementId: true, unlockedAt: true }
      })

      const unlockedMap = new Map(
        unlockedAchievements.map(ua => [ua.achievementId, ua.unlockedAt])
      )

      const achievementsWithStatus = achievements.map(achievement => ({
        ...achievement,
        isUnlocked: unlockedMap.has(achievement.id),
        unlockedAt: unlockedMap.get(achievement.id) || null
      }))

      return apiResponse.success(achievementsWithStatus)
    }

    return apiResponse.success(achievements)
  } catch (error: any) {
    console.error('获取成就列表失败:', error)
    return apiResponse.error(`获取成就列表失败: ${error?.message || '未知错误'}`)
  }
}

// POST /api/achievements - 创建成就（管理员）
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
      name,
      description,
      icon,
      type,
      condition,
      points
    } = body

    if (!name || !description || !type || !condition) {
      return apiResponse.error('参数错误：name、description、type和condition为必填项', 400)
    }

    const achievementId = `ach_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const achievement = await prisma.achievements.create({
      data: {
        id: achievementId,
        name,
        description,
        icon: icon || '🏆',
        type,
        condition,
        points: points || 0,
        updatedAt: new Date()
      }
    })

    return apiResponse.success({
      message: '成就创建成功',
      achievement
    })
  } catch (error: any) {
    console.error('创建成就失败:', error)
    return apiResponse.error(`创建成就失败: ${error?.message || '未知错误'}`)
  }
}
