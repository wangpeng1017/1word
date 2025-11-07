import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { VocabularyCreateInput } from '@/types'

// 获取词汇列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const isHighFrequency = searchParams.get('isHighFrequency')
    const difficulty = searchParams.get('difficulty')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { primaryMeaning: { contains: search } },
      ]
    }

    if (isHighFrequency !== null) {
      where.isHighFrequency = isHighFrequency === 'true'
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    const [vocabularies, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.vocabulary.count({ where }),
    ])

    return successResponse({
      vocabularies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('获取词汇列表错误:', error)
    console.error('错误详情:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    })
    return errorResponse(`获取词汇列表失败: ${error?.message || '未知错误'}`, 500)
  }
}

// 创建词汇
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以创建词汇')
    }

    const body: VocabularyCreateInput = await request.json()
    const {
      word,
      partOfSpeech,
      primaryMeaning,
      secondaryMeaning,
      phonetic,
      phoneticUS,
      phoneticUK,
      isHighFrequency,
      difficulty,
    } = body

    if (!word || !partOfSpeech || partOfSpeech.length === 0 || !primaryMeaning) {
      return errorResponse('缺少必填字段')
    }

    // 检查单词是否已存在
    const existing = await prisma.vocabulary.findUnique({
      where: { word: word.toLowerCase() },
    })

    if (existing) {
      return errorResponse('该单词已存在')
    }

    const vocabulary = await prisma.vocabulary.create({
      data: {
        word: word.toLowerCase(),
        partOfSpeech,
        primaryMeaning,
        secondaryMeaning,
        phonetic,
        phoneticUS,
        phoneticUK,
        isHighFrequency: isHighFrequency || false,
        difficulty: difficulty || 'MEDIUM',
      },
    })

    return successResponse(vocabulary, '词汇创建成功')
  } catch (error) {
    console.error('创建词汇错误:', error)
    return errorResponse('创建词汇失败', 500)
  }
}
