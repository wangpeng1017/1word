import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { calculateNextReviewDate, getTodayDate } from '@/lib/ebbinghaus'
import { generateId } from '@/lib/id-generator'

/**
 * 为学生批量生成学习计划
 * POST /api/study-plans/generate
 * P3: 优化 N+1 查询性能
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
      const students = await prisma.students.findMany({
        where: { class_id: classId },
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

    const vocabularies = await prisma.vocabularies.findMany({
      where,
      select: {
        id: true,
        difficulty: true,
      },
    })

    if (vocabularies.length === 0) {
      return errorResponse('没有找到词汇')
    }

    const vocabIds = vocabularies.map(v => v.id)

    // P3: 批量查询已存在的学习计划（替代 N+1 查询）
    const existingPlans = await prisma.study_plans.findMany({
      where: {
        studentId: { in: targetStudents },
        vocabularyId: { in: vocabIds }
      },
      select: { studentId: true, vocabularyId: true }
    })

    // 构建已存在计划的 Set 用于快速查找
    const existingPlanSet = new Set(
      existingPlans.map(p => `${p.studentId}|${p.vocabularyId}`)
    )

    // P3: 批量查询已存在的 word_masteries
    const existingMasteries = await prisma.word_masteries.findMany({
      where: {
        studentId: { in: targetStudents },
        vocabularyId: { in: vocabIds }
      },
      select: { studentId: true, vocabularyId: true }
    })

    const existingMasterySet = new Set(
      existingMasteries.map(m => `${m.studentId}|${m.vocabularyId}`)
    )

    // 批量构建要创建的学习计划
    const today = getTodayDate()
    const studyPlansToCreate: any[] = []
    const masteryToCreate: any[] = []

    for (const studentId of targetStudents) {
      for (const vocab of vocabularies) {
        const key = `${studentId}|${vocab.id}`

        // 检查学习计划是否已存在
        if (!existingPlanSet.has(key)) {
          // 计算第一次复习时间
          const nextReviewAt = calculateNextReviewDate(
            today,
            0, // 复习次数为0
            1, // 初始正确率100%
            vocab.difficulty as 'EASY' | 'MEDIUM' | 'HARD'
          )

          studyPlansToCreate.push({
            id: generateId('sp'),
            studentId,
            vocabularyId: vocab.id,
            status: 'PENDING' as const,
            reviewCount: 0,
            nextReviewAt,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }

        // 检查 word_mastery 是否已存在
        if (!existingMasterySet.has(key)) {
          masteryToCreate.push({
            id: generateId('wm'),
            studentId,
            vocabularyId: vocab.id,
            totalWrongCount: 0,
            consecutiveCorrect: 0,
            isMastered: false,
            isDifficult: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      }
    }

    // 批量插入学习计划
    if (studyPlansToCreate.length > 0) {
      await prisma.study_plans.createMany({
        data: studyPlansToCreate,
        skipDuplicates: true,
      })
    }

    // 批量插入 word_masteries
    if (masteryToCreate.length > 0) {
      await prisma.word_masteries.createMany({
        data: masteryToCreate,
        skipDuplicates: true,
      })
    }

    return successResponse({
      studentsCount: targetStudents.length,
      vocabulariesCount: vocabularies.length,
      plansCreated: studyPlansToCreate.length,
      masteriesCreated: masteryToCreate.length,
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
