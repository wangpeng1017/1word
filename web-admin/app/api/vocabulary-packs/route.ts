/**
 * @file route.ts
 * @desc 词汇库管理 API - 列表查询、创建、更新、删除
 * @input 依赖: prisma, auth, response
 * @output 导出: GET/POST/PUT/DELETE /api/vocabulary-packs
 * @see PRD: docs/vocabulary-packs/PRD.md
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// GET /api/vocabulary-packs - 获取词汇库列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')
    if (!payload) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [packs, total] = await Promise.all([
      prisma.vocabulary_packs.findMany({
        where,
        include: {
          pack_days: {
            orderBy: { dayNumber: 'asc' },
            select: { id: true, dayNumber: true, title: true, wordCount: true }
          },
          _count: { select: { plan_classes: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vocabulary_packs.count({ where })
    ])

    return successResponse({
      packs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error: any) {
    return errorResponse(error.message, 500)
  }
}

// POST /api/vocabulary-packs - 创建词汇库
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以创建词汇库')
    }

    const body = await request.json()
    const { name, description, totalDays } = body

    if (!name || !totalDays) {
      return errorResponse('名称和天数为必填项')
    }

    // 检查名称是否重复
    const existing = await prisma.vocabulary_packs.findUnique({ where: { name } })
    if (existing) {
      return errorResponse('词汇库名称已存在')
    }

    // 创建词汇库和每日配置
    const pack = await prisma.$transaction(async (tx) => {
      const newPack = await tx.vocabulary_packs.create({
        data: {
          id: `vp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          totalDays,
          createdBy: payload.userId,
        }
      })

      // 自动创建每日配置
      const days = Array.from({ length: totalDays }, (_, i) => ({
        id: `vpd_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        packId: newPack.id,
        dayNumber: i + 1,
        title: `Day ${i + 1}`,
      }))

      await tx.vocabulary_pack_days.createMany({ data: days })

      return tx.vocabulary_packs.findUnique({
        where: { id: newPack.id },
        include: { pack_days: { orderBy: { dayNumber: 'asc' } } }
      })
    })

    return successResponse(pack, '创建成功')
  } catch (error: any) {
    return errorResponse(error.message, 500)
  }
}

// PUT /api/vocabulary-packs - 更新词汇库基本信息（支持扩展天数）
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以修改词汇库')
    }

    const body = await request.json()
    const { id, name, description, isActive, totalDays } = body

    if (!id) return errorResponse('缺少词汇库ID')

    // 如果要修改天数，先检查合法性
    if (totalDays !== undefined) {
      const existing = await prisma.vocabulary_packs.findUnique({
        where: { id },
        select: { totalDays: true }
      })
      if (!existing) return errorResponse('词汇库不存在', 404)
      if (totalDays < existing.totalDays) {
        return errorResponse(`天数只能增加，不能从 ${existing.totalDays} 缩小到 ${totalDays}`)
      }
    }

    const pack = await prisma.$transaction(async (tx) => {
      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (isActive !== undefined) updateData.isActive = isActive

      // 扩展天数：更新 totalDays 并创建新的空 Day 记录
      if (totalDays !== undefined) {
        const current = await tx.vocabulary_packs.findUnique({
          where: { id },
          select: { totalDays: true }
        })
        const oldDays = current!.totalDays
        updateData.totalDays = totalDays

        if (totalDays > oldDays) {
          const newDays = Array.from({ length: totalDays - oldDays }, (_, i) => ({
            id: `vpd_${Date.now()}_${oldDays + i}_${Math.random().toString(36).substr(2, 9)}`,
            packId: id,
            dayNumber: oldDays + i + 1,
            title: `Day ${oldDays + i + 1}`,
          }))
          await tx.vocabulary_pack_days.createMany({ data: newDays })
        }
      }

      await tx.vocabulary_packs.update({
        where: { id },
        data: updateData,
      })

      return tx.vocabulary_packs.findUnique({
        where: { id },
        include: { pack_days: { orderBy: { dayNumber: 'asc' } } }
      })
    })

    return successResponse(pack, '更新成功')
  } catch (error: any) {
    return errorResponse(error.message, 500)
  }
}

// DELETE /api/vocabulary-packs?id=xxx - 删除词汇库
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以删除词汇库')
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return errorResponse('缺少词汇库ID')

    // 查询词汇库信息及关联的班级计划
    const pack = await prisma.vocabulary_packs.findUnique({
      where: { id },
      select: {
        name: true,
        plan_classes: {
          select: {
            id: true,
            classes: { select: { name: true } },
          },
        },
      },
    })
    if (!pack) return errorResponse('词汇库不存在', 404)

    // 如果有关联的班级计划，拒绝删除
    if (pack.plan_classes.length > 0) {
      const classNames = pack.plan_classes
        .map(pc => pc.classes?.name || '未知班级')
        .join('、')
      return errorResponse(
        `该词汇库「${pack.name}」正在被 ${pack.plan_classes.length} 个班级计划使用（${classNames}），请先删除关联的班级计划后再删除词汇库`,
        400
      )
    }

    await prisma.vocabulary_packs.delete({ where: { id } })

    // 记录操作日志
    try {
      await prisma.operation_logs.create({
        data: {
          userId: payload.userId,
          userName: payload.email || payload.userId,
          action: 'DELETE',
          module: 'vocabulary-packs',
          target: pack.name,
          targetId: id,
        },
      })
    } catch (logError) {
      console.error('记录操作日志失败:', logError)
    }

    return successResponse(null, '删除成功')
  } catch (error: any) {
    return errorResponse(error.message, 500)
  }
}
