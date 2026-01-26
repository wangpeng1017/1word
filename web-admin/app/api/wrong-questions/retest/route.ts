/**
 * @file route.ts
 * @desc 错题重测API - 获取重测题目、提交答案
 */

import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'
import {
  getRetestQuestions,
  submitRetestAnswers,
  checkWrongQuestionAchievements,
  getTotalCorrectWrongQuestions,
} from '@/lib/wrong-questions-retest'
import { grantBadgeForAchievement } from '@/lib/badge-service'
import { prisma } from '@/lib/prisma'

// GET /api/wrong-questions/retest - 获取重测题目
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    // 获取学生ID
    const student = await prisma.students.findUnique({
      where: { user_id: payload.userId },
    })

    if (!student) {
      return apiResponse.error('学生信息不存在', 404)
    }

    const result = await getRetestQuestions(student.id)

    return apiResponse.success(result)
  } catch (error: any) {
    console.error('获取重测题目失败:', error)
    return apiResponse.error(`获取重测题目失败: ${error?.message || '未知错误'}`)
  }
}

// POST /api/wrong-questions/retest - 提交重测答案
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return apiResponse.unauthorized('未授权')

    const payload = verifyToken(token)
    if (!payload) return apiResponse.unauthorized('Token无效')

    const { answers } = await request.json()
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return apiResponse.error('缺少答案数据', 400)
    }

    // 获取学生ID
    const student = await prisma.students.findUnique({
      where: { user_id: payload.userId },
    })

    if (!student) {
      return apiResponse.error('学生信息不存在', 404)
    }

    // 提交答案
    const result = await submitRetestAnswers(student.id, answers)

    // 检查错题成就
    const totalCorrect = await getTotalCorrectWrongQuestions(student.id)
    const achievementResult = await checkWrongQuestionAchievements(student.id, totalCorrect)

    // 为解锁的成就发放勋章
    for (const achievement of achievementResult.unlockedAchievements) {
      await grantBadgeForAchievement(student.id, achievement.id)
    }

    return apiResponse.success({
      ...result,
      totalCorrectWrongQuestions: totalCorrect,
      unlockedAchievements: achievementResult.unlockedAchievements,
    })
  } catch (error: any) {
    console.error('提交重测答案失败:', error)
    return apiResponse.error(`提交重测答案失败: ${error?.message || '未知错误'}`)
  }
}
