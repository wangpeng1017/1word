import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// POST /api/vocabulary-packs/[id]/generate-plans - 基于词汇库生成班级学习计划
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: packId } = await params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以生成学习计划')
    }

    const body = await request.json()
    const { classIds, startDate, preview = false } = body

    if (!classIds || classIds.length === 0) {
      return errorResponse('请选择至少一个班级')
    }
    if (!startDate) {
      return errorResponse('请选择开始日期')
    }

    // 获取词汇库及其词汇
    const pack = await prisma.vocabulary_packs.findUnique({
      where: { id: packId },
      include: {
        pack_days: {
          include: {
            day_words: {
              include: {
                vocabulary: {
                  select: { id: true, word: true, primary_meaning: true }
                }
              }
            }
          }
        }
      }
    })

    if (!pack) return errorResponse('词汇库不存在', 404)
    if (!pack.isActive) return errorResponse('该词汇库已禁用')

    // 验证班级并获取学生
    const classes = await prisma.classes.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true }
    })
    if (classes.length !== classIds.length) {
      return errorResponse('部分班级不存在')
    }

    const students = await prisma.students.findMany({
      where: { class_id: { in: classIds } },
      select: { id: true, class_id: true, user: { select: { name: true } } }
    })

    if (students.length === 0) {
      return errorResponse('所选班级没有学生')
    }

    // 收集所有词汇
    const allVocabs: any[] = []
    pack.pack_days.forEach(day => {
      day.day_words.forEach(dw => {
        if (dw.vocabulary) allVocabs.push(dw.vocabulary)
      })
    })
    const vocabIds = allVocabs.map(v => v.id)

    // 检查词汇是否有题目
    const vocabsWithQuestions = await prisma.questions.groupBy({
      by: ['vocabularyId'],
      where: { vocabularyId: { in: vocabIds } }
    })
    const hasQuestionSet = new Set(vocabsWithQuestions.map(v => v.vocabularyId))

    // 检查已存在的班级计划
    const existingPlans = await prisma.plan_classes.findMany({
      where: { class_id: { in: classIds }, pack_id: packId },
      select: { class_id: true }
    })
    const existingClassIds = new Set(existingPlans.map(p => p.class_id))

    // 构建预估数据（兼容前端格式）
    const created: any[] = []
    const duplicates: any[] = []
    const invalid: any[] = []

    for (const classId of classIds) {
      const classStudents = students.filter(s => s.class_id === classId)
      const isExisting = existingClassIds.has(classId)

      for (const vocab of allVocabs) {
        const hasQuestion = hasQuestionSet.has(vocab.id)

        for (const student of classStudents) {
          const item = {
            studentId: student.id,
            studentName: student.user?.name || '未知',
            classId,
            vocabularyId: vocab.id,
            word: vocab.word,
            primaryMeaning: vocab.primary_meaning || '',
          }

          if (!hasQuestion) {
            invalid.push({ ...item, status: 'INVALID' })
          } else if (isExisting) {
            duplicates.push({ ...item, status: 'DUPLICATE' })
          } else {
            created.push({ ...item, status: 'PENDING' })
          }
        }
      }
    }

    // 预览模式直接返回
    if (preview) {
      return successResponse({
        packName: pack.name,
        totalDays: pack.totalDays,
        totalWords: pack.totalWords,
        createdCount: created.length,
        duplicateCount: duplicates.length,
        invalidCount: invalid.length,
        created: created.slice(0, 100),
        duplicates: duplicates.slice(0, 100),
        invalid: invalid.slice(0, 100),
      }, '预估完成')
    }

    // 实际生成：只创建 plan_classes 记录
    const timestamp = Date.now()
    const newClassIds = classIds.filter((id: string) => !existingClassIds.has(id))
    const plansToCreate = newClassIds.map((classId: string, i: number) => ({
      id: `pc_${timestamp}_${i}_${Math.random().toString(36).slice(2, 8)}`,
      class_id: classId,
      pack_id: packId,
      status: 'ACTIVE' as const,
      start_date: new Date(startDate),
      updated_at: new Date(),
    }))

    if (plansToCreate.length > 0) {
      await prisma.plan_classes.createMany({
        data: plansToCreate,
        skipDuplicates: true,
      })
    }

    return successResponse({
      packName: pack.name,
      totalDays: pack.totalDays,
      totalWords: pack.totalWords,
      createdCount: created.length,
      duplicateCount: duplicates.length,
      invalidCount: invalid.length,
      created: created.slice(0, 100),
      duplicates: duplicates.slice(0, 100),
      invalid: invalid.slice(0, 100),
    }, `成功为 ${newClassIds.length} 个班级创建学习计划`)
  } catch (error: any) {
    console.error('生成学习计划错误:', error)
    return errorResponse(error.message, 500)
  }
}
