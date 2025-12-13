import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

// GET /api/vocabulary-packs/[id] - 获取词汇库详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    const payload = verifyToken(token || '')
    if (!payload) return unauthorizedResponse()

    const pack = await prisma.vocabulary_packs.findUnique({
      where: { id: params.id },
      include: {
        pack_days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            day_words: {
              orderBy: { orderIndex: 'asc' },
              include: {
                vocabulary: {
                  select: {
                    id: true,
                    word: true,
                    primary_meaning: true,
                    difficulty: true,
                    is_high_frequency: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!pack) return errorResponse('词汇库不存在', 404)

    return successResponse(pack)
  } catch (error: any) {
    return errorResponse(error.message, 500)
  }
}
