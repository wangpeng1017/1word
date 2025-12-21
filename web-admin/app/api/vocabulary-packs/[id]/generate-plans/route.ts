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
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以生成学习计划')
    }

    const body = await request.json()
    const { classIds, startDate } = body

    if (!classIds || classIds.length === 0) {
      return errorResponse('请选择至少一个班级')
    }
    if (!startDate) {
      return errorResponse('请选择开始日期')
    }

    // 获取词汇库
    const pack = await prisma.vocabulary_packs.findUnique({
      where: { id: packId },
      select: { id: true, name: true, totalDays: true, totalWords: true, isActive: true }
    })

    if (!pack) return errorResponse('词汇库不存在', 404)
    if (!pack.isActive) return errorResponse('该词汇库已禁用')

    // 验证班级
    const classes = await prisma.classes.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true }
    })
    if (classes.length !== classIds.length) {
      return errorResponse('部分班级不存在')
    }

    // 检查已存在的计划
    const existingPlans = await prisma.plan_classes.findMany({
      where: { class_id: { in: classIds }, pack_id: packId },
      select: { class_id: true }
    })
    const existingClassIds = new Set(existingPlans.map(p => p.class_id))

    // 创建新计划
    const timestamp = Date.now()
    const plansToCreate = classIds
      .filter((classId: string) => !existingClassIds.has(classId))
      .map((classId: string, i: number) => ({
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
      createdCount: plansToCreate.length,
      skippedCount: existingClassIds.size,
    }, `成功为 ${plansToCreate.length} 个班级创建学习计划${existingClassIds.size > 0 ? `，跳过 ${existingClassIds.size} 个已存在的计划` : ''}`)
  } catch (error: any) {
    console.error('生成学习计划错误:', error)
    return errorResponse(error.message, 500)
  }
}
