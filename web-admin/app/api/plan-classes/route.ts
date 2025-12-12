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
              difficulty: true,
              is_high_frequency: true,
              // 使用 word_meanings 获取释义
              word_meanings: {
                orderBy: { orderIndex: 'asc' },
                take: 1,
                select: { meaning: true },
              },
            },
          },
        },
      }),
      prisma.plan_classes.count({ where }),
    ])

    // 格式化返回数据，将 word_meanings 映射为 primaryMeaning
    const formattedPlanClasses = planClasses.map((pc: any) => ({
      ...pc,
      vocabularies: {
        ...pc.vocabularies,
        primary_meaning: pc.vocabularies?.word_meanings?.[0]?.meaning || '',
      },
    }))

    return successResponse({
      planClasses: formattedPlanClasses,
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

    // P7: 数量限制检查
    const MAX_CLASSES = 10
    const MAX_VOCABULARIES = 200
    const MAX_TOTAL_PLANS = 5000

    if (classIds.length > MAX_CLASSES) {
      return errorResponse(`单次最多选择 ${MAX_CLASSES} 个班级，当前选择了 ${classIds.length} 个`)
    }

    if (vocabularyIds.length > MAX_VOCABULARIES) {
      return errorResponse(`单次最多选择 ${MAX_VOCABULARIES} 个词汇，当前选择了 ${vocabularyIds.length} 个`)
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
        // 使用 word_meanings 获取释义
        word_meanings: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
          select: { meaning: true },
        },
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

    // P7: 检查总计划数量限制
    const estimatedPlans = studentsByClass.length * validVocabularyIds.length
    if (estimatedPlans > MAX_TOTAL_PLANS) {
      return errorResponse(
        `预计生成 ${estimatedPlans} 条计划（${studentsByClass.length} 学生 × ${validVocabularyIds.length} 词汇），超过单次限制 ${MAX_TOTAL_PLANS}。请分批操作。`
      )
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
        vocabularies: {
          select: {
            word: true,
            word_meanings: {
              orderBy: { orderIndex: 'asc' },
              take: 1,
              select: { meaning: true },
            },
          },
        },
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
          primaryMeaning: v.word_meanings?.[0]?.meaning || '',
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
        primaryMeaning: p.vocabularies?.word_meanings?.[0]?.meaning || '',
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
        primaryMeaning: vocabMap.get(vocabularyId)?.word_meanings?.[0]?.meaning || '',
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
    const planClassIdMap = new Map<string, string>() // key: `${classId}|${vocabularyId}`, value: planClassId
    if (classIds.length > 0 && validVocabularyIds.length > 0) {
      const planClassData: any[] = []
      const timestamp = Date.now()
      let counter = 0
      for (const classId of classIds) {
        for (const vocabularyId of validVocabularyIds) {
          const pcId = `pc_${timestamp}_${counter++}_${Math.random().toString(36).substr(2, 9)}`
          planClassIdMap.set(`${classId}|${vocabularyId}`, pcId)
          planClassData.push({
            id: pcId,
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

      // 查询已存在的 plan_classes 以获取其 ID（用于关联）
      const existingPlanClasses = await prisma.plan_classes.findMany({
        where: {
          class_id: { in: classIds },
          vocabulary_id: { in: validVocabularyIds },
        },
        select: { id: true, class_id: true, vocabulary_id: true },
      })
      for (const pc of existingPlanClasses) {
        planClassIdMap.set(`${pc.class_id}|${pc.vocabulary_id}`, pc.id)
      }
    }

    // 2) overwrite模式已移除，始终跳过已存在的计划
    // 简化逻辑，不再重置已存在的计划

    // 3) 批量插入新的study_plans（需要提供必填字段：id、updatedAt、planClassId）
    if (toCreatePairs.length > 0) {
      const ts = Date.now()
      let idx = 0
      await prisma.study_plans.createMany({
        data: toCreatePairs.map(({ studentId, vocabularyId }) => {
          // 根据学生所属班级获取 planClassId
          const studentClassId = studentMap.get(studentId)?.class_id
          const planClassId = studentClassId ? planClassIdMap.get(`${studentClassId}|${vocabularyId}`) : null
          return {
            id: `sp_${ts}_${idx++}_${Math.random().toString(36).substr(2, 9)}`,
            studentId,
            vocabularyId,
            planClassId: planClassId || null, // 记录来源班级计划ID
            status: 'PENDING' as const,
            reviewCount: 0,
            nextReviewAt: new Date(startDate),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }),
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
        vocabularies: {
          select: {
            word: true,
            word_meanings: {
              orderBy: { orderIndex: 'asc' },
              take: 1,
              select: { meaning: true },
            },
          },
        },
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
        primaryMeaning: p?.vocabularies?.word_meanings?.[0]?.meaning ?? vocabMap.get(vocabularyId)?.word_meanings?.[0]?.meaning ?? '',
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
      primaryMeaning: p.vocabularies?.word_meanings?.[0]?.meaning || '',
      status: p.status,
      reviewCount: p.reviewCount,
      nextReviewAt: p.nextReviewAt,
      createdAt: p.createdAt,
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
    }, `生成完成：新增 ${created.length} 条，已跳过 ${duplicates.length} 条${invalidItems.length > 0 ? `，${invalidItems.length} 条因无题目被跳过` : ''}`)
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
            word_meanings: {
              orderBy: { orderIndex: 'asc' },
              take: 1,
              select: { meaning: true },
            },
          },
        },
      },
    })

    // 格式化返回数据
    const formattedPlanClass = {
      ...planClass,
      vocabularies: {
        ...planClass.vocabularies,
        primary_meaning: planClass.vocabularies?.word_meanings?.[0]?.meaning || '',
      },
    }

    return successResponse(formattedPlanClass, '班级学习计划更新成功')
  } catch (error: any) {
    console.error('更新班级学习计划错误:', error)
    return errorResponse(`更新班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 批量删除班级学习计划（级联删除学生计划）
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

    // 1. 获取要删除的 plan_classes 详情
    const planClassesToDelete = await prisma.plan_classes.findMany({
      where: { id: { in: ids } },
      select: { class_id: true, vocabulary_id: true }
    })

    if (planClassesToDelete.length === 0) {
      return errorResponse('未找到要删除的计划')
    }

    // 2. 查找关联班级的所有学生
    const classIds = [...new Set(planClassesToDelete.map(p => p.class_id))]
    const students = await prisma.students.findMany({
      where: { class_id: { in: classIds } },
      select: { id: true, class_id: true }
    })

    // 3. 构建要删除的学生学习计划条件
    const studyPlanDeleteConditions: Array<{ studentId: { in: string[] }, vocabularyId: string }> = []
    const dailyTaskDeleteConditions: Array<{ studentId: { in: string[] }, vocabularyId: string }> = []

    for (const pc of planClassesToDelete) {
      const studentIds = students
        .filter(s => s.class_id === pc.class_id)
        .map(s => s.id)

      if (studentIds.length > 0) {
        studyPlanDeleteConditions.push({
          studentId: { in: studentIds },
          vocabularyId: pc.vocabulary_id
        })
        dailyTaskDeleteConditions.push({
          studentId: { in: studentIds },
          vocabularyId: pc.vocabulary_id
        })
      }
    }

    // 4. 统计将删除的记录数
    let deletedStudyPlansCount = 0
    let deletedDailyTasksCount = 0

    // 5. 使用事务执行级联删除
    await prisma.$transaction(async (tx) => {
      // 删除学生的每日任务
      for (const cond of dailyTaskDeleteConditions) {
        const result = await tx.daily_tasks.deleteMany({ where: cond })
        deletedDailyTasksCount += result.count
      }

      // 删除学生的学习计划
      for (const cond of studyPlanDeleteConditions) {
        const result = await tx.study_plans.deleteMany({ where: cond })
        deletedStudyPlansCount += result.count
      }

      // 删除班级计划
      await tx.plan_classes.deleteMany({
        where: { id: { in: ids } }
      })
    })

    return successResponse({
      deletedPlanClasses: ids.length,
      deletedStudyPlans: deletedStudyPlansCount,
      deletedDailyTasks: deletedDailyTasksCount
    }, `删除成功：${ids.length} 个班级计划，${deletedStudyPlansCount} 个学生计划，${deletedDailyTasksCount} 个每日任务`)
  } catch (error: any) {
    console.error('删除班级学习计划错误:', error)
    return errorResponse(`删除班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}
