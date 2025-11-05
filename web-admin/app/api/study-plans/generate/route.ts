import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { calculateNextReviewDate, getTodayDate } from '@/lib/ebbinghaus'

/**
 * 为学生批量生成学习计划
 * POST /api/study-plans/generate
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以生成学习计划')
    }

    const body = await request.json()
    const { 
      studentIds,      // 学生ID数组
      vocabularyIds,   // 词汇ID数组（可选，不传则为所有词汇）
      classId,         // 班级ID（可选，按班级批量生成）
    } = body

    // 获取目标学生列表
    let targetStudents: string[] = []
    
    if (classId) {
      // 按班级获取学生
      const students = await prisma.student.findMany({
        where: { classId, user: { isActive: true } },
        select: { id: true },
      })
      targetStudents = students.map(s => s.id)
    } else if (studentIds && studentIds.length > 0) {
      targetStudents = studentIds
    } else {
      return errorResponse('请指定学生或班级')
    }

    if (targetStudents.length === 0) {
      return errorResponse('没有找到符合条件的学生')
    }

    // 获取词汇列表
    const where: any = {}
    if (vocabularyIds && vocabularyIds.length > 0) {
      where.id = { in: vocabularyIds }
    }

    const vocabularies = await prisma.vocabulary.findMany({
      where,
      select: { 
        id: true,
        difficulty: true,
      },
    })

    if (vocabularies.length === 0) {
      return errorResponse('没有找到词汇')
    }

    // 批量创建学习计划
    const today = getTodayDate()
    const studyPlansToCreate = []

    for (const studentId of targetStudents) {
      for (const vocab of vocabularies) {
        // 检查是否已存在
        const existing = await prisma.studyPlan.findUnique({
          where: {
            studentId_vocabularyId: {
              studentId,
              vocabularyId: vocab.id,
            },
          },
        })

        if (!existing) {
          // 计算第一次复习时间（明天）
          const nextReviewAt = calculateNextReviewDate(
            today,
            0, // 复习次数为0
            1, // 初始正确率100%
            vocab.difficulty as 'EASY' | 'MEDIUM' | 'HARD'
          )

          studyPlansToCreate.push({
            studentId,
            vocabularyId: vocab.id,
            status: 'PENDING' as const,
            reviewCount: 0,
            nextReviewAt,
          })
        }
      }
    }

    // 批量插入
    if (studyPlansToCreate.length > 0) {
      await prisma.studyPlan.createMany({
        data: studyPlansToCreate,
        skipDuplicates: true, // 跳过重复的
      })

      // 为每个学生创建WordMastery记录
      const masteryToCreate = []
      for (const studentId of targetStudents) {
        for (const vocab of vocabularies) {
          const existingMastery = await prisma.wordMastery.findUnique({
            where: {
              studentId_vocabularyId: {
                studentId,
                vocabularyId: vocab.id,
              },
            },
          })

          if (!existingMastery) {
            masteryToCreate.push({
              studentId,
              vocabularyId: vocab.id,
              totalWrongCount: 0,
              consecutiveCorrect: 0,
              isMastered: false,
              isDifficult: false,
            })
          }
        }
      }

      if (masteryToCreate.length > 0) {
        await prisma.wordMastery.createMany({
          data: masteryToCreate,
          skipDuplicates: true,
        })
      }
    }

    return successResponse({
      studentsCount: targetStudents.length,
      vocabulariesCount: vocabularies.length,
      plansCreated: studyPlansToCreate.length,
    }, '学习计划生成成功')
  } catch (error: any) {
    console.error('生成学习计划错误:', error)
    console.error('错误详情:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    })
    return errorResponse(`生成学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}
