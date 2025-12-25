import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// PUT /api/vocabulary-packs/[id]/days - 更新某天的词汇
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以修改词汇库')
    }

    const body = await request.json()
    const { dayNumber, vocabularyIds, title } = body

    if (!dayNumber) return errorResponse('缺少天数')

    // 查找对应的day
    const packDay = await prisma.vocabulary_pack_days.findUnique({
      where: { packId_dayNumber: { packId: params.id, dayNumber } }
    })

    if (!packDay) return errorResponse('该天配置不存在', 404)

    await prisma.$transaction(async (tx) => {
      // 更新标题
      if (title !== undefined) {
        await tx.vocabulary_pack_days.update({
          where: { id: packDay.id },
          data: { title }
        })
      }

      // 如果提供了词汇ID列表，更新词汇
      if (vocabularyIds !== undefined) {
        // 删除旧的关联
        await tx.vocabulary_pack_day_words.deleteMany({
          where: { packDayId: packDay.id }
        })

        // 创建新的关联
        if (vocabularyIds.length > 0) {
          const dayWords = vocabularyIds.map((vocabId: string, index: number) => ({
            id: `vpdw_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            packDayId: packDay.id,
            vocabularyId: vocabId,
            orderIndex: index,
          }))
          await tx.vocabulary_pack_day_words.createMany({ data: dayWords })
        }

        // 更新该天的词汇数
        await tx.vocabulary_pack_days.update({
          where: { id: packDay.id },
          data: { wordCount: vocabularyIds.length }
        })

        // 更新词汇库总词汇数
        const allDays = await tx.vocabulary_pack_days.findMany({
          where: { packId: params.id },
          select: { wordCount: true }
        })
        const totalWords = allDays.reduce((sum, d) => sum + d.wordCount, 0)
        await tx.vocabulary_packs.update({
          where: { id: params.id },
          data: { totalWords }
        })
      }
    })

    // 返回更新后的数据
    const updatedDay = await prisma.vocabulary_pack_days.findUnique({
      where: { id: packDay.id },
      include: {
        day_words: {
          orderBy: { orderIndex: 'asc' },
          include: {
            vocabulary: {
              select: { id: true, word: true, primary_meaning: true, difficulty: true }
            }
          }
        }
      }
    })

    return successResponse(updatedDay, '更新成功')
  } catch (error: any) {
    return errorResponse(error.message, 500)
  }
}
