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
    const includeMeanings = searchParams.get('includeMeanings') === 'true'

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
    const includeOptions: any = {}
    
    if (includeAudios) {
      includeOptions.word_audios = {
        orderBy: { createdAt: 'asc' }
      }
    }
    
    if (includeMeanings) {
      includeOptions.word_meanings = {
        orderBy: { orderIndex: 'asc' }
      }
    }
    
    const [vocabularies, total] = await Promise.all([
      prisma.vocabularies.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: Object.keys(includeOptions).length > 0 ? includeOptions : undefined,
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
      
      // 映射多词性多释义数据
      if (vocab.word_meanings) {
        result.meanings = vocab.word_meanings.map((meaning: any) => ({
          id: meaning.id,
          partOfSpeech: meaning.partOfSpeech,
          meaning: meaning.meaning,
          orderIndex: meaning.orderIndex,
          examples: meaning.examples || [],
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
      meanings,
      partOfSpeech, // 向后兼容旧字段
      primaryMeaning, // 向后兼容旧字段
      secondaryMeaning,
      phonetic,
      phoneticUS,
      phoneticUK,
      isHighFrequency,
      difficulty,
      audioUrlUS,
      audioUrlUK,
      imageUrl,
      imageDescription,
    } = body

    // 验证: 支持新的 meanings 或旧的 partOfSpeech + primaryMeaning
    if (!word) {
      return errorResponse('请输入单词')
    }
    
    const hasMeanings = meanings && Array.isArray(meanings) && meanings.length > 0
    const hasOldFormat = partOfSpeech && partOfSpeech.length > 0 && primaryMeaning
    
    if (!hasMeanings && !hasOldFormat) {
      return errorResponse('请添加至少一个释义，或填写词性和核心释义')
    }

    // 检查单词是否已存在
    const existing = await prisma.vocabularies.findUnique({
      where: { word: word.toLowerCase() },
    })

    if (existing) {
      return errorResponse('该单词已存在')
    }

    const vocabId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 使用事务创建词汇和释义
    const vocabulary = await prisma.$transaction(async (tx) => {
      // 创建词汇
      const vocab = await tx.vocabularies.create({
        data: {
          id: vocabId,
          word: word.toLowerCase(),
          part_of_speech: partOfSpeech || [], // 向后兼容
          primary_meaning: primaryMeaning || '', // 向后兼容
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
      
      // 创建多释义
      if (hasMeanings) {
        await tx.word_meanings.createMany({
          data: meanings.map((m: any, index: number) => ({
            id: `wm_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            vocabulary_id: vocabId,
            part_of_speech: m.partOfSpeech,
            meaning: m.meaning,
            order_index: index,
            examples: m.examples || [],
            created_at: new Date(),
            updated_at: new Date(),
          })),
        })
      }
      
      // 创建音频
      if (audioUrlUS) {
        await tx.word_audios.create({
          data: {
            id: `wa_${Date.now()}_us_${Math.random().toString(36).substr(2, 9)}`,
            vocabulary_id: vocabId,
            audio_url: audioUrlUS,
            accent: 'US',
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      }
      
      if (audioUrlUK) {
        await tx.word_audios.create({
          data: {
            id: `wa_${Date.now()}_uk_${Math.random().toString(36).substr(2, 9)}`,
            vocabulary_id: vocabId,
            audio_url: audioUrlUK,
            accent: 'UK',
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      }
      
      // 创建图片
      if (imageUrl) {
        await tx.word_images.create({
          data: {
            id: `wi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            vocabulary_id: vocabId,
            image_url: imageUrl,
            description: imageDescription,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      }
      
      return vocab
    })

    const { audio_url, created_at, updated_at, ...rest } = vocabulary as any
    return successResponse({ ...rest, audioUrl: audio_url ?? null, createdAt: created_at, updatedAt: updated_at }, '词汇创建成功')
  } catch (error) {
    console.error('创建词汇错误:', error)
    return errorResponse('创建词汇失败', 500)
  }
}
