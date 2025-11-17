import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * 优化的题目列表API
 * 
 * 性能优化点:
 * 1. 游标分页 (Cursor-based Pagination) - 替代 offset 分页
 * 2. 可选的 COUNT 查询 - 减少不必要的计数
 * 3. 索引优化字段 - 基于已添加的数据库索引
 * 4. 精简返回字段 - 减少数据传输量
 */

// 内存缓存 - 生产环境应使用 Redis
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1分钟

function getCacheKey(params: Record<string, any>): string {
  return JSON.stringify(params)
}

function getFromCache(key: string) {
  const cached = cache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() })
  
  // 限制缓存大小
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const vocabularyId = searchParams.get('vocabularyId')
    const type = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // 最大100条
    const cursor = searchParams.get('cursor') // 游标ID
    const needCount = searchParams.get('needCount') === 'true' // 是否需要总数
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // 构建缓存键
    const cacheKey = getCacheKey({
      vocabularyId,
      type,
      limit,
      cursor,
      needCount,
      sortOrder,
    })

    // 检查缓存
    const cached = getFromCache(cacheKey)
    if (cached) {
      return successResponse(cached)
    }

    // 构建查询条件
    const where: any = {}
    
    if (vocabularyId) {
      where.vocabularyId = vocabularyId
    }
    
    if (type) {
      where.type = type
    }

    // 游标分页查询
    const cursorCondition = cursor ? {
      cursor: { id: cursor },
      skip: 1, // 跳过游标本身
    } : {}

    // 执行查询
    const questionsPromise = prisma.questions.findMany({
      where,
      ...cursorCondition,
      take: limit,
      orderBy: { createdAt: sortOrder },
      select: {
        id: true,
        type: true,
        content: true,
        sentence: true,
        audioUrl: true,
        correctAnswer: true,
        createdAt: true,
        updatedAt: true,
        vocabularyId: true,
        vocabularies: {
          select: {
            word: true,
            primary_meaning: true,
          },
        },
        question_options: {
          select: {
            id: true,
            content: true,
            isCorrect: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    // 只在需要时执行 COUNT 查询
    const countPromise = needCount 
      ? prisma.questions.count({ where })
      : Promise.resolve(null)

    const [questions, total] = await Promise.all([
      questionsPromise,
      countPromise,
    ])

    // 格式化数据
    const formattedQuestions = questions.map((q: any) => ({
      id: q.id,
      type: q.type,
      content: q.content,
      sentence: q.sentence,
      audioUrl: q.audioUrl,
      correctAnswer: q.correctAnswer,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      vocabularyId: q.vocabularyId,
      vocabulary: {
        word: q.vocabularies?.word || '',
        primaryMeaning: q.vocabularies?.primary_meaning || '',
      },
      options: q.question_options || [],
    }))

    // 获取下一个游标
    const nextCursor = questions.length === limit 
      ? questions[questions.length - 1].id 
      : null

    const result = {
      questions: formattedQuestions,
      pagination: {
        limit,
        nextCursor,
        hasMore: questions.length === limit,
        ...(total !== null && { total }),
      },
    }

    // 缓存结果
    setCache(cacheKey, result)

    return successResponse(result)
  } catch (error: any) {
    console.error('获取题目列表错误:', error)
    return errorResponse(`获取题目列表失败: ${error?.message || '未知错误'}`, 500)
  }
}

/**
 * 批量获取题目数量 - 优化的计数API
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { filters } = body

    // 批量查询多个条件的数量
    const counts = await Promise.all(
      filters.map(async (filter: any) => {
        const where: any = {}
        
        if (filter.vocabularyId) {
          where.vocabularyId = filter.vocabularyId
        }
        
        if (filter.type) {
          where.type = filter.type
        }

        const count = await prisma.questions.count({ where })
        
        return {
          filter,
          count,
        }
      })
    )

    return successResponse({ counts })
  } catch (error: any) {
    console.error('批量查询数量错误:', error)
    return errorResponse(`批量查询失败: ${error?.message || '未知错误'}`, 500)
  }
}
