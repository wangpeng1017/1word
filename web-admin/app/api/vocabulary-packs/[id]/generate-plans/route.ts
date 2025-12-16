import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// POST /api/vocabulary-packs/[id]/generate-plans - 基于词汇库生成班级学习计划
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以生成学习计划')
    }

    const body = await request.json()
    const { classIds, startDate, preview = false } = body

    if (!classIds || classIds.length === 0) {
      return errorResponse('请选择至少一个班级')
    }
    if (!startDate) {
      return errorResponse('请选择开始日期')
    }

    // 获取词汇库及其每日配置
    const pack = await prisma.vocabulary_packs.findUnique({
      where: { id: params.id },
      include: {
        pack_days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            day_words: { select: { vocabularyId: true, orderIndex: true } }
          }
        }
      }
    })

    if (!pack) return errorResponse('词汇库不存在', 404)
    if (!pack.isActive) return errorResponse('该词汇库已禁用')

    // 获取班级学生
    const students = await prisma.students.findMany({
      where: { class_id: { in: classIds } },
      select: { id: true, class_id: true }
    })

    if (students.length === 0) {
      return errorResponse('所选班级没有学生')
    }

    // 收集所有词汇ID
    const allVocabIds = new Set<string>()
    pack.pack_days.forEach(day => {
      day.day_words.forEach(w => allVocabIds.add(w.vocabularyId))
    })

    // 获取词汇详情（用于返回给前端显示）
    const vocabDetails = await prisma.vocabularies.findMany({
      where: { id: { in: Array.from(allVocabIds) } },
      select: {
        id: true,
        word: true,
        word_meanings: { orderBy: { orderIndex: 'asc' }, take: 1, select: { meaning: true } }
      }
    })
    const vocabMap = new Map(vocabDetails.map(v => [v.id, { word: v.word, primaryMeaning: v.word_meanings?.[0]?.meaning || '' }]))

    // 检查词汇是否有题目
    const vocabsWithQuestions = await prisma.questions.groupBy({
      by: ['vocabularyId'],
      where: { vocabularyId: { in: Array.from(allVocabIds) } }
    })
    const vocabsWithQuestionsSet = new Set(vocabsWithQuestions.map(v => v.vocabularyId))

    // 获取已存在的计划
    const existingPlans = await prisma.study_plans.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        vocabularyId: { in: Array.from(allVocabIds) }
      },
      select: { studentId: true, vocabularyId: true }
    })
    const existingPlanSet = new Set(existingPlans.map(p => `${p.studentId}_${p.vocabularyId}`))

    // 构建计划数据
    const baseDate = new Date(startDate)
    const created: any[] = []
    const duplicates: any[] = []
    const invalid: any[] = []

    for (const day of pack.pack_days) {
      const taskDate = new Date(baseDate)
      taskDate.setDate(taskDate.getDate() + day.dayNumber - 1)

      for (const wordItem of day.day_words) {
        const vocabId = wordItem.vocabularyId
        const hasQuestion = vocabsWithQuestionsSet.has(vocabId)

        for (const student of students) {
          const key = `${student.id}_${vocabId}`
          const vocabInfo = vocabMap.get(vocabId)
          const item = {
            studentId: student.id,
            classId: student.class_id,
            vocabularyId: vocabId,
            word: vocabInfo?.word || '',
            primaryMeaning: vocabInfo?.primaryMeaning || '',
            dayNumber: day.dayNumber,
            taskDate: taskDate.toISOString().split('T')[0],
          }

          if (!hasQuestion) {
            invalid.push({ ...item, status: 'INVALID' })
          } else if (existingPlanSet.has(key)) {
            duplicates.push({ ...item, status: 'DUPLICATE' })
          } else {
            created.push(item)
          }
        }
      }
    }

    // 预览模式直接返回
    if (preview) {
      return successResponse({
        packName: pack.name,
        totalDays: pack.totalDays,
        classCount: classIds.length,
        studentCount: students.length,
        createdCount: created.length,
        duplicateCount: duplicates.length,
        invalidCount: invalid.length,
        created: created.slice(0, 100),
        duplicates: duplicates.slice(0, 100),
        invalid: invalid.slice(0, 100),
      }, '预估完成')
    }

    // 实际生成计划
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date()
      const studyPlansData: any[] = []
      const dailyTasksData: any[] = []
      const wordMasteriesData: any[] = []

      // 获取已存在的掌握度记录
      const existingMasteries = await tx.word_masteries.findMany({
        where: {
          studentId: { in: students.map(s => s.id) },
          vocabularyId: { in: Array.from(allVocabIds) }
        },
        select: { studentId: true, vocabularyId: true }
      })
      const existingMasterySet = new Set(existingMasteries.map(m => `${m.studentId}_${m.vocabularyId}`))

      // 艾宾浩斯复习间隔累计偏移量：Day 1, 2, 4, 7, 15 对应 +0, +1, +3, +6, +14 天
      const reviewOffsets = [0, 1, 3, 6, 14]

      for (const item of created) {
        const baseDate = new Date(item.taskDate)

        // 为每个单词生成5条复习计划（Day 1, 2, 4, 7, 15）
        // study_plans 表唯一约束为 [studentId, vocabularyId, reviewCount]
        for (let i = 0; i < reviewOffsets.length; i++) {
          const taskDate = new Date(baseDate)
          taskDate.setDate(taskDate.getDate() + reviewOffsets[i])

          const planId = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          studyPlansData.push({
            id: planId,
            studentId: item.studentId,
            vocabularyId: item.vocabularyId,
            status: 'PENDING',
            reviewCount: i,
            nextReviewAt: taskDate,
            createdAt: now,
            updatedAt: now,
          })

          dailyTasksData.push({
            id: `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            studentId: item.studentId,
            vocabularyId: item.vocabularyId,
            taskDate: taskDate,
            status: 'PENDING',
            createdAt: now,
            updatedAt: now,
          })
        }

        const masteryKey = `${item.studentId}_${item.vocabularyId}`
        if (!existingMasterySet.has(masteryKey)) {
          existingMasterySet.add(masteryKey)
          wordMasteriesData.push({
            id: `wm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            studentId: item.studentId,
            vocabularyId: item.vocabularyId,
            totalWrongCount: 0,
            consecutiveCorrect: 0,
            isMastered: false,
            isDifficult: false,
            createdAt: now,
            updatedAt: now,
          })
        }
      }

      if (studyPlansData.length > 0) {
        await tx.study_plans.createMany({ data: studyPlansData, skipDuplicates: true })
      }
      if (dailyTasksData.length > 0) {
        await tx.daily_tasks.createMany({ data: dailyTasksData, skipDuplicates: true })
      }
      if (wordMasteriesData.length > 0) {
        await tx.word_masteries.createMany({ data: wordMasteriesData, skipDuplicates: true })
      }

      return { studyPlans: studyPlansData.length, dailyTasks: dailyTasksData.length }
    })

    return successResponse({
      packName: pack.name,
      createdCount: created.length,
      duplicateCount: duplicates.length,
      invalidCount: invalid.length,
      ...result
    }, `成功生成 ${created.length} 条学习计划`)
  } catch (error: any) {
    console.error('生成学习计划错误:', error)
    return errorResponse(error.message, 500)
  }
}
