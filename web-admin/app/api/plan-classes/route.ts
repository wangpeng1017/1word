import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// 获取班级学习计划列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}

    if (classId) {
      where.class_id = classId
    }

    if (status) {
      where.status = status
    }

    const [planClasses, total] = await Promise.all([
      prisma.plan_classes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          classes: {
            select: {
              name: true,
              grade: true,
            },
          },
          vocabularies: {
            select: {
              word: true,
              primary_meaning: true,
              difficulty: true,
              is_high_frequency: true,
            },
          },
        },
      }),
      prisma.plan_classes.count({ where }),
    ])

    return successResponse({
      planClasses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('获取班级学习计划列表错误:', error)
    return errorResponse(`获取班级学习计划列表失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 批量创建班级学习计划（支持预估与详细结果返回）
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以创建班级学习计划')
    }

    const body = await request.json()
    const { classIds, vocabularyIds, startDate, endDate, preview = false, overwrite = false } = body || {}

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return errorResponse('请选择至少一个班级')
    }

    if (!vocabularyIds || !Array.isArray(vocabularyIds) || vocabularyIds.length === 0) {
      return errorResponse('请选择至少一个词汇')
    }

    if (!startDate) {
      return errorResponse('请指定计划开始日期')
    }

    // 验证班级是否存在
    const classes = await prisma.classes.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, grade: true },
    })
    if (classes.length !== classIds.length) {
      return errorResponse('部分班级不存在')
    }

    // 验证词汇是否存在，并检查是否有题目
    const vocabularies = await prisma.vocabularies.findMany({
      where: { id: { in: vocabularyIds } },
      select: {
        id: true,
        word: true,
        primary_meaning: true,
        questions: { select: { id: true } } // 检查题目数量
      },
    })
    if (vocabularies.length !== vocabularyIds.length) {
      return errorResponse('部分词汇不存在')
    }

    // 筛选出无题目的单词
    const validVocabularies = vocabularies.filter(v => v.questions && v.questions.length > 0)
    const invalidVocabularies = vocabularies.filter(v => !v.questions || v.questions.length === 0)
    const validVocabularyIds = validVocabularies.map(v => v.id)

    // 查目标学生
    const studentsByClass = await prisma.students.findMany({
      where: { class_id: { in: classIds } },
      select: {
        id: true,
        class_id: true,
        user: { select: { name: true } },
      },
    })

    if (studentsByClass.length === 0) {
      return errorResponse('所选班级下没有学生')
    }

    const studentIds = studentsByClass.map(s => s.id)
    const vocabMap = new Map(vocabularies.map(v => [v.id, v]))
    const studentMap = new Map(studentsByClass.map(s => [s.id, s]))

    // 预取已存在的学习计划（用于判重与明细返回）
    // 注意：这里只查询有效单词的计划，无效单词直接归类为 invalid
    const existingPlans = await prisma.study_plans.findMany({
      where: {
        studentId: { in: studentIds },
        vocabularyId: { in: validVocabularyIds },
      },
      include: {
        students: { select: { user: { select: { name: true } }, class_id: true } },
        vocabularies: { select: { word: true, primary_meaning: true } },
      },
    })

    const existingKeySet = new Set(existingPlans.map(p => `${p.studentId}|${p.vocabularyId}`))

    // 计算将要创建的组合（学生×有效词汇）
    const toCreatePairs: Array<{ studentId: string; vocabularyId: string }> = []
    for (const sid of studentIds) {
      for (const vid of validVocabularyIds) {
        const key = `${sid}|${vid}`
        if (!existingKeySet.has(key)) {
          toCreatePairs.push({ studentId: sid, vocabularyId: vid })
        }
      }
    }

    // 构建无效列表（每个学生 x 每个无效单词）
    const invalidItems: any[] = []
    for (const sid of studentIds) {
      for (const v of invalidVocabularies) {
        invalidItems.push({
          studentId: sid,
          studentName: studentMap.get(sid)?.user?.name,
          classId: studentMap.get(sid)?.class_id,
          vocabularyId: v.id,
          word: v.word,
          primaryMeaning: v.primary_meaning,
          status: 'INVALID', // 自定义状态
          reviewCount: 0,
          nextReviewAt: null,
          createdAt: null,
        })
      }
    }

    // 预估模式：不写库，直接返回详细列表
    if (preview) {
      const duplicates = existingPlans.map((p: any) => ({
        studentId: p.studentId,
        studentName: p.students?.user?.name,
        classId: p.students?.class_id,
        vocabularyId: p.vocabularyId,
        word: p.vocabularies?.word,
        primaryMeaning: p.vocabularies?.primary_meaning,
        status: p.status,
        reviewCount: p.reviewCount,
        nextReviewAt: p.nextReviewAt,
        createdAt: p.createdAt,
      }))
      const created = toCreatePairs.map(({ studentId, vocabularyId }) => ({
        studentId,
        studentName: studentMap.get(studentId)?.user?.name,
        classId: studentMap.get(studentId)?.class_id,
        vocabularyId,
        word: vocabMap.get(vocabularyId)?.word,
        primaryMeaning: vocabMap.get(vocabularyId)?.primary_meaning,
        status: 'PENDING',
        reviewCount: 0,
        nextReviewAt: new Date(startDate),
        createdAt: null,
      }))

      return successResponse({
        createdCount: created.length,
        duplicateCount: duplicates.length,
        updatedCount: 0,
        failedCount: 0,
        invalidCount: invalidItems.length,
        created,
        duplicates,
        updated: [],
        failed: [],
        invalid: invalidItems,
      })
    }

    // 写库：1) 班级计划去重写入 2) 处理overwrite 3) 插入新的study_plans
    // 1) 班级计划 createMany（幂等）
    // 注意：只写入有效单词的班级计划
    if (classIds.length > 0 && validVocabularyIds.length > 0) {
      const planClassData: any[] = []
      const timestamp = Date.now()
      let counter = 0
      for (const classId of classIds) {
        for (const vocabularyId of validVocabularyIds) {
          planClassData.push({
            id: `pc_${timestamp}_${counter++}_${Math.random().toString(36).substr(2, 9)}`,
            class_id: classId,
            vocabulary_id: vocabularyId,
            start_date: new Date(startDate),
            end_date: endDate ? new Date(endDate) : null,
            status: 'PENDING',
            created_at: new Date(),
            updated_at: new Date(),
          })
        }
      }
      await prisma.plan_classes.createMany({ data: planClassData, skipDuplicates: true })
    }

    // 2) overwrite：重置已存在计划的状态/时间
    let updatedKeys = new Set<string>()
    if (overwrite && existingPlans.length > 0) {
      // 批量更新可能需要分批，这里简单写法逐个更新以保证兼容性和明确性
      for (const p of existingPlans) {
        await prisma.study_plans.update({
          where: { id: p.id },
          data: {
            status: 'PENDING',
            reviewCount: 0,
            nextReviewAt: new Date(startDate),
            updatedAt: new Date(),
          },
        })
        updatedKeys.add(`${p.studentId}|${p.vocabularyId}`)
      }
    }

    // 3) 批量插入新的study_plans（需要提供必填字段：id、updatedAt）
    if (toCreatePairs.length > 0) {
      const ts = Date.now()
      let idx = 0
      await prisma.study_plans.createMany({
        data: toCreatePairs.map(({ studentId, vocabularyId }) => ({
          id: `sp_${ts}_${idx++}_${Math.random().toString(36).substr(2, 9)}`,
          studentId,
          vocabularyId,
          status: 'PENDING' as const,
          reviewCount: 0,
          nextReviewAt: new Date(startDate),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        skipDuplicates: true,
      })
    }

    // 回查一遍，构建返回的 created/duplicates/updated 明细列表（含 createdAt）
    const latest = await prisma.study_plans.findMany({
      where: {
        studentId: { in: studentIds },
        vocabularyId: { in: validVocabularyIds },
      },
      include: {
        students: { select: { user: { select: { name: true } }, class_id: true } },
        vocabularies: { select: { word: true, primary_meaning: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const latestMap = new Map(latest.map(p => [`${p.studentId}|${p.vocabularyId}`, p]))

    const created = toCreatePairs.map(({ studentId, vocabularyId }) => {
      const p: any = latestMap.get(`${studentId}|${vocabularyId}`)
      return {
        studentId,
        studentName: p?.students?.user?.name ?? studentMap.get(studentId)?.user?.name,
        classId: p?.students?.class_id ?? studentMap.get(studentId)?.class_id,
        vocabularyId,
        word: p?.vocabularies?.word ?? vocabMap.get(vocabularyId)?.word,
        primaryMeaning: p?.vocabularies?.primary_meaning ?? vocabMap.get(vocabularyId)?.primary_meaning,
        status: p?.status ?? 'PENDING',
        reviewCount: p?.reviewCount ?? 0,
        nextReviewAt: p?.nextReviewAt ?? new Date(startDate),
        createdAt: p?.createdAt ?? new Date(),
      }
    })

    const duplicates = existingPlans.map((p: any) => ({
      studentId: p.studentId,
      studentName: p.students?.user?.name,
      classId: p.students?.class_id,
      vocabularyId: p.vocabularyId,
      word: p.vocabularies?.word,
      primaryMeaning: p.vocabularies?.primary_meaning,
      status: p.status,
      reviewCount: p.reviewCount,
      nextReviewAt: p.nextReviewAt,
      createdAt: p.createdAt,
    }))

    const updated = overwrite ? Array.from(updatedKeys).map(key => {
      const [studentId, vocabularyId] = key.split('|')
      const p: any = latestMap.get(key)
      return {
        studentId,
        studentName: p?.students?.user?.name ?? studentMap.get(studentId)?.user?.name,
        classId: p?.students?.class_id ?? studentMap.get(studentId)?.class_id,
        vocabularyId,
        word: p?.vocabularies?.word ?? vocabMap.get(vocabularyId)?.word,
        primaryMeaning: p?.vocabularies?.primary_meaning ?? vocabMap.get(vocabularyId)?.primary_meaning,
        status: p?.status ?? 'PENDING',
        reviewCount: p?.reviewCount ?? 0,
        nextReviewAt: p?.nextReviewAt ?? new Date(startDate),
        createdAt: p?.createdAt,
      }
    }) : []

    return successResponse({
      createdCount: created.length,
      duplicateCount: duplicates.length,
      updatedCount: updated.length,
      failedCount: 0,
      invalidCount: invalidItems.length,
      created,
      duplicates,
      updated,
      failed: [],
      invalid: invalidItems,
    }, `生成完成：新增 ${created.length} 条，已存在 ${duplicates.length} 条${overwrite ? `，重置 ${updated.length} 条` : ''}${invalidItems.length > 0 ? `，${invalidItems.length} 条因无题目被跳过` : ''}`)
  } catch (error: any) {
    console.error('创建班级学习计划错误:', error)
    return errorResponse(`创建班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 更新班级学习计划
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以更新班级学习计划')
    }

    const body = await request.json()
    const { id, status, startDate, endDate } = body

    if (!id) {
      return errorResponse('缺少计划ID')
    }

    const updateData: any = {}

    if (status) {
      updateData.status = status
    }

    if (startDate) {
      updateData.start_date = new Date(startDate)
    }

    if (endDate !== undefined) {
      updateData.end_date = endDate ? new Date(endDate) : null
    }

    updateData.updated_at = new Date()

    const planClass = await prisma.plan_classes.update({
      where: { id },
      data: updateData,
      include: {
        classes: {
          select: {
            name: true,
            grade: true,
          },
        },
        vocabularies: {
          select: {
            word: true,
            primary_meaning: true,
          },
        },
      },
    })

    return successResponse(planClass, '班级学习计划更新成功')
  } catch (error: any) {
    console.error('更新班级学习计划错误:', error)
    return errorResponse(`更新班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 批量删除班级学习计划
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除班级学习计划')
    }

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return errorResponse('缺少计划ID')
    }

    await prisma.plan_classes.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return successResponse(null, '班级学习计划删除成功')
  } catch (error: any) {
    console.error('删除班级学习计划错误:', error)
    return errorResponse(`删除班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}
