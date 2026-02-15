import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// GET - 获取班级学习计划列表
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

    const where: any = {}
    if (classId) where.class_id = classId
    if (status) where.status = status

    const planClasses = await prisma.plan_classes.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        classes: {
          select: { name: true },
        },
        vocabulary_packs: {
          select: {
            id: true,
            name: true,
            totalDays: true,
            totalWords: true,
          },
        },
      },
    })

    return successResponse({ planClasses })
  } catch (error: any) {
    console.error('获取班级学习计划列表错误:', error)
    return errorResponse(`获取班级学习计划列表失败: ${error?.message || '未知错误'}`, 500)
  }
}

// POST - 创建班级学习计划（班级×词汇库关联）
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以创建班级学习计划')
    }

    const body = await request.json()
    const { classIds, packId, startDate } = body || {}

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return errorResponse('请选择至少一个班级')
    }

    if (!packId) {
      return errorResponse('请选择词汇库')
    }

    if (!startDate) {
      return errorResponse('请指定计划开始日期')
    }

    // 验证班级是否存在
    const classes = await prisma.classes.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true },
    })
    if (classes.length !== classIds.length) {
      return errorResponse('部分班级不存在')
    }

    // 验证词汇库是否存在
    const pack = await prisma.vocabulary_packs.findUnique({
      where: { id: packId },
      select: { id: true, name: true, totalDays: true, totalWords: true },
    })
    if (!pack) {
      return errorResponse('词汇库不存在')
    }

    // 检查是否已存在相同的班级×词汇库计划
    const existingPlans = await prisma.plan_classes.findMany({
      where: {
        class_id: { in: classIds },
        pack_id: packId,
      },
      select: { class_id: true },
    })
    const existingClassIds = new Set(existingPlans.map(p => p.class_id))

    // 创建新计划
    const timestamp = Date.now()
    const plansToCreate = classIds
      .filter(classId => !existingClassIds.has(classId))
      .map((classId, i) => ({
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
      createdCount: plansToCreate.length,
      skippedCount: existingClassIds.size,
      pack: pack,
    }, `创建成功：${plansToCreate.length} 个班级计划${existingClassIds.size > 0 ? `，跳过 ${existingClassIds.size} 个已存在的计划` : ''}`)
  } catch (error: any) {
    console.error('创建班级学习计划错误:', error)
    return errorResponse(`创建班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}

// PUT - 更新班级学习计划
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以更新班级学习计划')
    }

    const body = await request.json()
    const { id, status, startDate } = body

    if (!id) {
      return errorResponse('缺少计划ID')
    }

    const updateData: any = { updated_at: new Date() }
    if (status) updateData.status = status
    if (startDate) updateData.start_date = new Date(startDate)

    const planClass = await prisma.plan_classes.update({
      where: { id },
      data: updateData,
      include: {
        classes: { select: { name: true } },
        vocabulary_packs: { select: { id: true, name: true, totalDays: true, totalWords: true } },
      },
    })

    return successResponse(planClass, '班级学习计划更新成功')
  } catch (error: any) {
    console.error('更新班级学习计划错误:', error)
    return errorResponse(`更新班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}

// DELETE - 删除班级学习计划
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以删除班级学习计划')
    }

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return errorResponse('缺少计划ID')
    }

    await prisma.plan_classes.deleteMany({
      where: { id: { in: ids } },
    })

    return successResponse({
      deletedCount: ids.length,
    }, `删除成功：${ids.length} 个班级计划`)
  } catch (error: any) {
    console.error('删除班级学习计划错误:', error)
    return errorResponse(`删除班级学习计划失败: ${error?.message || '未知错误'}`, 500)
  }
}
