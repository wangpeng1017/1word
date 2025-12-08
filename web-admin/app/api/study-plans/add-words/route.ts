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
    const { studentId, vocabularyIds } = body

    if (!studentId) {
      return errorResponse('缺少学生ID')
    }

    if (!vocabularyIds || vocabularyIds.length === 0) {
      return errorResponse('请至少选择一个词汇')
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

      // 计算第一次复习时间
      const nextReviewAt = calculateNextReviewDate(
        today,
        0,
        1,
        vocab.difficulty as 'EASY' | 'MEDIUM' | 'HARD'
      )

      // 创建学习计划
      const plan = await prisma.study_plans.create({
        data: {
          studentId,
          vocabularyId: vocab.id,
          status: 'PENDING',
          reviewCount: 0,
          nextReviewAt,
        }
      })

      // 创建word_masteries记录
      await prisma.word_masteries.upsert({
        where: {
          studentId_vocabularyId: {
            studentId,
            vocabularyId: vocab.id,
          }
        },
        create: {
          studentId,
          vocabularyId: vocab.id,
          totalWrongCount: 0,
          consecutiveCorrect: 0,
          isMastered: false,
          isDifficult: false,
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
