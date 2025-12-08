import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { calculateNextReviewDate, getTodayDate } from '@/lib/ebbinghaus'

/**
 * 重置学习计划进度
 * POST /api/study-plans/reset
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以重置学习计划')
    }

    const body = await request.json()
    const { planIds } = body

    if (!planIds || planIds.length === 0) {
      return errorResponse('请至少选择一个学习计划')
    }

    // 获取要重置的学习计划
    const plans = await prisma.study_plans.findMany({
      where: {
        id: { in: planIds }
      },
      include: {
        vocabularies: {
          select: {
            word: true,
            primary_meaning: true,
            difficulty: true,
          }
        },
        students: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (plans.length === 0) {
      return errorResponse('没有找到要重置的学习计划')
    }

    const today = getTodayDate()
    const resetPlans = []

    // 重置每个学习计划
    for (const plan of plans) {
      // 计算新的首次复习时间
      const nextReviewAt = calculateNextReviewDate(
        today,
        0,
        1,
        plan.vocabularies.difficulty as 'EASY' | 'MEDIUM' | 'HARD'
      )

      // 更新学习计划
      const updatedPlan = await prisma.study_plans.update({
        where: { id: plan.id },
        data: {
          status: 'PENDING',
          reviewCount: 0,
          lastReviewAt: null,
          nextReviewAt,
          updatedAt: new Date(),
        }
      })

      // 重置word_masteries记录
      await prisma.word_masteries.updateMany({
        where: {
          studentId: plan.studentId,
          vocabularyId: plan.vocabularyId,
        },
        data: {
          totalWrongCount: 0,
          recentAccuracy: null,
          consecutiveCorrect: 0,
          isMastered: false,
          isDifficult: false,
          lastPracticeAt: null,
          updatedAt: new Date(),
        }
      })

      resetPlans.push({
        planId: updatedPlan.id,
        studentId: plan.studentId,
        studentName: plan.students.user.name,
        vocabularyId: plan.vocabularyId,
        word: plan.vocabularies.word,
        primaryMeaning: plan.vocabularies.primary_meaning,
        status: updatedPlan.status,
        reviewCount: updatedPlan.reviewCount,
        nextReviewAt: updatedPlan.nextReviewAt,
      })
    }

    return successResponse({
      resetCount: resetPlans.length,
      plans: resetPlans,
    }, `成功重置 ${resetPlans.length} 个学习计划`)
  } catch (error: any) {
    console.error('重置学习计划错误:', error)
    return errorResponse(`重置学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}
