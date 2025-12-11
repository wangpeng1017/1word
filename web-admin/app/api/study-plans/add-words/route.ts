import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { calculateNextReviewDate, getTodayDate } from '@/lib/ebbinghaus'

/**
 * 为单个学生添加词汇到学习计划
 * POST /api/study-plans/add-words
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以添加学习计划')
    }

    const body = await request.json()
    const { studentId, vocabularyIds, startDate, endDate } = body

    if (!studentId) {
      return errorResponse('缺少学生ID')
    }

    if (!vocabularyIds || vocabularyIds.length === 0) {
      return errorResponse('请至少选择一个词汇')
    }

    // 解析开始日期（默认今天）
    const planStartDate = startDate ? new Date(startDate) : getTodayDate()
    planStartDate.setHours(0, 0, 0, 0)

    // 解析结束日期（可选）
    const planEndDate = endDate ? new Date(endDate) : null
    if (planEndDate) {
      planEndDate.setHours(23, 59, 59, 999)
    }

    // 验证学生是否存在
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    if (!student) {
      return errorResponse('学生不存在')
    }

    // 获取词汇信息
    const vocabularies = await prisma.vocabularies.findMany({
      where: {
        id: { in: vocabularyIds }
      },
      select: {
        id: true,
        word: true,
        primary_meaning: true,
        difficulty: true,
      }
    })

    if (vocabularies.length === 0) {
      return errorResponse('没有找到有效的词汇')
    }

    const today = getTodayDate()
    const created = []
    const duplicates = []

    // 为每个词汇创建学习计划
    for (const vocab of vocabularies) {
      // 检查是否已存在
      const existing = await prisma.study_plans.findUnique({
        where: {
          studentId_vocabularyId: {
            studentId,
            vocabularyId: vocab.id,
          }
        }
      })

      if (existing) {
        duplicates.push({
          studentId,
          studentName: student.user.name,
          vocabularyId: vocab.id,
          word: vocab.word,
          primaryMeaning: vocab.primary_meaning,
        })
        continue
      }

      // 新添加的词汇：nextReviewAt = 开始日期（当天可学）
      const nextReviewAt = planStartDate

      // 生成唯一ID
      const planId = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 创建学习计划
      const plan = await prisma.study_plans.create({
        data: {
          id: planId,
          studentId,
          vocabularyId: vocab.id,
          status: 'PENDING',
          reviewCount: 0,
          nextReviewAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })

      // 创建word_masteries记录
      const masteryId = `wm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await prisma.word_masteries.upsert({
        where: {
          studentId_vocabularyId: {
            studentId,
            vocabularyId: vocab.id,
          }
        },
        create: {
          id: masteryId,
          studentId,
          vocabularyId: vocab.id,
          totalWrongCount: 0,
          consecutiveCorrect: 0,
          isMastered: false,
          isDifficult: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {}
      })

      created.push({
        planId: plan.id,
        studentId,
        studentName: student.user.name,
        vocabularyId: vocab.id,
        word: vocab.word,
        primaryMeaning: vocab.primary_meaning,
        status: plan.status,
        nextReviewAt: plan.nextReviewAt,
      })
    }

    return successResponse({
      created: created.length,
      duplicates: duplicates.length,
      total: vocabularyIds.length,
      plans: created,
      duplicateList: duplicates,
    }, `成功添加 ${created.length} 个词汇${duplicates.length > 0 ? `，${duplicates.length} 个词汇已存在` : ''}`)
  } catch (error: any) {
    console.error('添加词汇到学习计划错误:', error)
    return errorResponse(`添加词汇失败: ${error?.message || '未知错误'}`, 500)
  }
}
