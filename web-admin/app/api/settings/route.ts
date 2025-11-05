import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * 获取系统设置
 * GET /api/settings
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以查看系统设置')
    }

    // 获取所有设置
    const settings = await prisma.systemConfig.findMany()

    // 转换为键值对格式
    const settingsMap: Record<string, any> = {}
    settings.forEach(setting => {
      try {
        // 尝试解析JSON值
        settingsMap[setting.key] = JSON.parse(setting.value)
      } catch {
        // 如果不是JSON，直接使用字符串值
        settingsMap[setting.key] = setting.value
      }
    })

    // 如果没有设置，返回默认值
    if (Object.keys(settingsMap).length === 0) {
      settingsMap.reviewRules = {
        masteryThreshold: 3,
        difficultThreshold: 3,
        dailyNewWords: 20,
        dailyReviewWords: 30,
        interruptHours: 24,
      }
      settingsMap.systemInfo = {
        systemName: '智能词汇复习助手',
        version: 'v1.0.0',
        defaultPassword: '123456',
      }
    }

    return successResponse(settingsMap)
  } catch (error) {
    console.error('获取系统设置错误:', error)
    return errorResponse('获取系统设置失败', 500)
  }
}

/**
 * 更新系统设置
 * PUT /api/settings
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以修改系统设置')
    }

    const body = await request.json()
    const { key, value, description } = body

    if (!key) {
      return errorResponse('缺少设置键名')
    }

    // 将值转换为JSON字符串存储
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    // 更新或创建设置
    await prisma.systemConfig.upsert({
      where: { key },
      create: {
        key,
        value: valueStr,
        description,
      },
      update: {
        value: valueStr,
        description,
      },
    })

    return successResponse({ key, value }, '设置已更新')
  } catch (error) {
    console.error('更新系统设置错误:', error)
    return errorResponse('更新系统设置失败', 500)
  }
}

/**
 * 批量更新系统设置
 * POST /api/settings/batch
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以修改系统设置')
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return errorResponse('无效的设置数据')
    }

    // 批量更新设置
    const updates = Object.entries(settings).map(([key, value]) => {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
      
      return prisma.systemConfig.upsert({
        where: { key },
        create: {
          key,
          value: valueStr,
        },
        update: {
          value: valueStr,
        },
      })
    })

    await Promise.all(updates)

    return successResponse(settings, '批量更新成功')
  } catch (error) {
    console.error('批量更新系统设置错误:', error)
    return errorResponse('批量更新系统设置失败', 500)
  }
}
