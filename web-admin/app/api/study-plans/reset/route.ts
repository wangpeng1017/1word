import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { resetStudyPlans } from '@/lib/study-plan-helpers'

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

    // 使用公共函数重置学习计划
    const resetPlans = await resetStudyPlans(planIds)

    if (resetPlans.length === 0) {
      return errorResponse('没有找到要重置的学习计划')
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
