import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { REVIEW_INTERVALS } from '@/lib/ebbinghaus'


// 根据 reviewCount 获取记忆天数标签
function getDayLabel(reviewCount: number) {
  if (reviewCount >= REVIEW_INTERVALS.length) {
    return 'Day ' + REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1] + '+';
  }
  return 'Day ' + REVIEW_INTERVALS[reviewCount];
}

// 获取学习计划列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const studentName = searchParams.get('studentName')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const vocabularyId = searchParams.get('vocabularyId')
    const groupBy = searchParams.get('groupBy')
    // 新增：日期筛选
    const nextReviewStart = searchParams.get('nextReviewStart')
    const nextReviewEnd = searchParams.get('nextReviewEnd')
    const createdStart = searchParams.get('createdStart')
    const createdEnd = searchParams.get('createdEnd')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (studentId) {
      where.studentId = studentId
    }

    // 关联筛选：班级、学生姓名
    const studentsWhere: any = {}
    if (classId) {
      studentsWhere.class_id = classId
    }
    if (studentName) {
      studentsWhere.user = { name: { contains: studentName, mode: 'insensitive' } }
    }
    if (Object.keys(studentsWhere).length > 0) {
      where.students = studentsWhere
    }
    
    if (status) {
      where.status = status
    }

    if (vocabularyId) {
      where.vocabularyId = vocabularyId
    }

    // 下次复习日期筛选
    if (nextReviewStart || nextReviewEnd) {
      where.nextReviewAt = {}
      if (nextReviewStart) {
        where.nextReviewAt.gte = new Date(nextReviewStart)
      }
      if (nextReviewEnd) {
        const endDate = new Date(nextReviewEnd)
        endDate.setHours(23, 59, 59, 999)
        where.nextReviewAt.lte = endDate
      }
    }

    // 创建时间筛选
    if (createdStart || createdEnd) {
      where.createdAt = {}
      if (createdStart) {
        where.createdAt.gte = new Date(createdStart)
      }
      if (createdEnd) {
        const endDate = new Date(createdEnd)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // 按班级分组模式
    if (groupBy === 'class') {
      const allRows = await prisma.study_plans.findMany({
        where,
        orderBy: [{ nextReviewAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          students: {
            include: {
              user: { select: { name: true } },
              classes: { select: { id: true, name: true, grade: true } },
            },
          },
          vocabularies: {
            select: {
              id: true,
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

      // 按 班级ID + 下次复习日期 + reviewCount 分组
      const groupMap = new Map<string, {
        classId: string
        className: string
        grade: string
        students: Map<string, { id: string; name: string }>
        vocabularies: Map<string, { id: string; word: string; primaryMeaning: string }>
        reviewCount: number
        dayLabel: string
        nextReviewAt: Date | null
        createdAt: Date
        planIds: string[]
      }>()

      for (const sp of allRows) {
        const classInfo = (sp as any).students?.classes
        if (!classInfo) continue

        // 按班级 + 记忆天数(reviewCount) 分组，合并同一班级同一天的所有学生和单词
        const groupKey = `${classInfo.id}-${sp.reviewCount}`

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            classId: classInfo.id,
            className: classInfo.name,
            grade: classInfo.grade || '',
            students: new Map(),
            vocabularies: new Map(),
            reviewCount: sp.reviewCount,
            dayLabel: getDayLabel(sp.reviewCount),
            nextReviewAt: sp.nextReviewAt,
            createdAt: sp.createdAt,
            planIds: [],
          })
        }

        const group = groupMap.get(groupKey)!
        group.planIds.push(sp.id)

        const studentInfo = (sp as any).students
        if (studentInfo?.user?.name) {
          group.students.set(sp.studentId, {
            id: sp.studentId,
            name: studentInfo.user.name,
          })
        }

        if (sp.vocabularies) {
          group.vocabularies.set(sp.vocabularyId, {
            id: sp.vocabularyId,
            word: sp.vocabularies.word,
            primaryMeaning: (sp.vocabularies as any).word_meanings?.[0]?.meaning || '',
          })
        }

        if (sp.createdAt < group.createdAt) {
          group.createdAt = sp.createdAt
        }
      }

      const groupedPlans = Array.from(groupMap.values())
        .map(g => ({
          id: `${g.classId}-${g.reviewCount}`,
          classId: g.classId,
          className: g.className,
          grade: g.grade,
          students: Array.from(g.students.values()),
          vocabularies: Array.from(g.vocabularies.values()),
          reviewCount: g.reviewCount,
          dayLabel: g.dayLabel,
          nextReviewAt: g.nextReviewAt,
          createdAt: g.createdAt,
          planIds: g.planIds,
        }))
        .sort((a, b) => {
          if (a.nextReviewAt && b.nextReviewAt) {
            return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
          }
          return 0
        })

      const total = groupedPlans.length
      const paginatedPlans = groupedPlans.slice(skip, skip + limit)

      return successResponse({
        studyPlans: paginatedPlans,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    }

    // 原有的扁平列表模式
    const [rows, total] = await Promise.all([
      prisma.study_plans.findMany({
        where,
        skip,
        take: limit,
        // 默认按创建时间倒序，最新的在最上面
        orderBy: { createdAt: 'desc' },
        include: {
          students: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
              classes: {
                select: {
                  name: true,
                },
              },
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
      prisma.study_plans.count({ where }),
    ])

    // 统一前端需要的数据结构
    const studyPlans = rows.map((sp: any) => ({
      id: sp.id,
      studentId: sp.studentId,
      vocabularyId: sp.vocabularyId,
      planClassId: sp.planClassId, // 新增：来源班级计划ID
      status: sp.status,
      reviewCount: sp.reviewCount,
      lastReviewAt: sp.lastReviewAt,
      nextReviewAt: sp.nextReviewAt,
      createdAt: sp.createdAt,
      updatedAt: sp.updatedAt,
      student: { ...sp.students, class: sp.students?.classes },
      vocabulary: {
        word: sp.vocabularies?.word,
        // 从 word_meanings 获取释义
        primaryMeaning: sp.vocabularies?.word_meanings?.[0]?.meaning || '',
        difficulty: sp.vocabularies?.difficulty,
        isHighFrequency: sp.vocabularies?.is_high_frequency,
      },
    }))

    return successResponse({
      studyPlans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('获取学习计划列表错误:', error)
    return errorResponse(`获取学习计划列表失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 更新学习计划
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以更新学习计划')
    }

    const body = await request.json()
    const { planId, status, nextReviewAt } = body

    if (!planId) {
      return errorResponse('缺少计划ID')
    }

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (nextReviewAt) {
      updateData.nextReviewAt = new Date(nextReviewAt)
    }

    const studyPlan = await prisma.study_plans.update({
      where: { id: planId },
      data: updateData,
      include: {
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
    const formattedPlan = {
      ...studyPlan,
      vocabularies: {
        word: studyPlan.vocabularies?.word,
        primary_meaning: studyPlan.vocabularies?.word_meanings?.[0]?.meaning || '',
      },
    }

    return successResponse(formattedPlan, '学习计划更新成功')
  } catch (error: any) {
    console.error('更新学习计划错误:', error)
    return errorResponse(`更新学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 批量删除学习计划
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以删除学习计划')
    }

    const { searchParams } = new URL(request.url)
    const planIds = searchParams.get('ids')?.split(',') || []

    if (planIds.length === 0) {
      return errorResponse('缺少计划ID')
    }

    await prisma.study_plans.deleteMany({
      where: {
        id: {
          in: planIds,
        },
      },
    })

    return successResponse(null, '学习计划删除成功')
  } catch (error: any) {
    console.error('删除学习计划错误:', error)
    return errorResponse(`删除学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}
