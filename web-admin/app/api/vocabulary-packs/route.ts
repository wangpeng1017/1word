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
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以创建词汇库')
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

// PUT /api/vocabulary-packs - 更新词汇库基本信息
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以修改词汇库')
    }

    const body = await request.json()
    const { id, name, description, isActive } = body

    if (!id) return errorResponse('缺少词汇库ID')

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const pack = await prisma.vocabulary_packs.update({
      where: { id },
      data: updateData,
      include: { pack_days: { orderBy: { dayNumber: 'asc' } } }
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
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除词汇库')
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return errorResponse('缺少词汇库ID')

    await prisma.vocabulary_packs.delete({ where: { id } })

    return successResponse(null, '删除成功')
  } catch (error: any) {
    return errorResponse(error.message, 500)
  }
}
