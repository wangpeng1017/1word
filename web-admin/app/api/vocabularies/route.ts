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
    // 性能优化: 默认limit从10000降低到50，减少内存占用
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const search = searchParams.get('search') || ''
    const isHighFrequency = searchParams.get('isHighFrequency')
    const difficulty = searchParams.get('difficulty')
    const includeAudios = searchParams.get('includeAudios') === 'true'

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { primary_meaning: { contains: search } },
      ]
    }

    if (isHighFrequency !== null) {
      where.is_high_frequency = isHighFrequency === 'true'
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    // 索引使用: idx_vocabularies_frequency_difficulty, idx_vocabularies_created_at_desc
    const [vocabularies, total] = await Promise.all([
      prisma.vocabularies.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: includeAudios ? {
          word_audios: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        } : undefined,
      }),
      prisma.vocabularies.count({ where }),
    ])

    // 将 snake_case 映射为前端预期的 camelCase 字段
    const mapped = vocabularies.map((vocab: any) => {
      const result: any = {
        id: vocab.id,
        word: vocab.word,
        partOfSpeech: vocab.part_of_speech || [],
        primaryMeaning: vocab.primary_meaning || '',
        secondaryMeaning: vocab.secondary_meaning || null,
        phonetic: vocab.phonetic || null,
        phoneticUS: vocab.phonetic_us || null,
        phoneticUK: vocab.phonetic_uk || null,
        audioUrl: vocab.audio_url || null,
        isHighFrequency: vocab.is_high_frequency || false,
        difficulty: vocab.difficulty || 'MEDIUM',
        createdAt: vocab.created_at,
        updatedAt: vocab.updated_at,
      }
      
      // 映射音频数据
      if (vocab.word_audios) {
        result.audios = vocab.word_audios.map((audio: any) => ({
          id: audio.id,
          audioUrl: audio.audioUrl || audio.audio_url,
          accent: audio.accent,
          duration: audio.duration,
          createdAt: audio.createdAt || audio.created_at,
        }))
      }
      
      return result
    })

    return successResponse({
      vocabularies: mapped,
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
    const existing = await prisma.vocabularies.findUnique({
      where: { word: word.toLowerCase() },
    })

    if (existing) {
      return errorResponse('该单词已存在')
    }

    const vocabulary = await prisma.vocabularies.create({
      data: {
        id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        word: word.toLowerCase(),
        part_of_speech: partOfSpeech,
        primary_meaning: primaryMeaning,
        secondary_meaning: secondaryMeaning,
        phonetic,
        phonetic_us: phoneticUS,
        phonetic_uk: phoneticUK,
        is_high_frequency: isHighFrequency || false,
        difficulty: difficulty || 'MEDIUM',
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    const { audio_url, created_at, updated_at, ...rest } = vocabulary as any
    return successResponse({ ...rest, audioUrl: audio_url ?? null, createdAt: created_at, updatedAt: updated_at }, '词汇创建成功')
  } catch (error) {
    console.error('创建词汇错误:', error)
    return errorResponse('创建词汇失败', 500)
  }
}
