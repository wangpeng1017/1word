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
    const includeImages = searchParams.get('includeImages') === 'true'

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        // 搜索 word_meanings 表中的释义
        { word_meanings: { some: { meaning: { contains: search } } } },
      ]
    }

    if (isHighFrequency !== null) {
      where.is_high_frequency = isHighFrequency === 'true'
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    // 排序参数
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const rFirst = searchParams.get('rFirst') === 'true'

    // 索引使用: idx_vocabularies_frequency_difficulty, idx_vocabularies_created_at_desc
    const includeOptions: any = {
      // 始终包含 word_meanings，用于获取 primaryMeaning
      word_meanings: {
        orderBy: { orderIndex: 'asc' as const }
      }
    }

    if (includeAudios) {
      includeOptions.word_audios = {
        orderBy: { createdAt: 'asc' }
      }
    }

    if (includeImages) {
      includeOptions.word_images = {
        orderBy: { createdAt: 'desc' },
        take: 1 // 只取第一张图片用于列表展示
      }
    }

    // 构建排序条件
    let orderByClause: any = { created_at: 'desc' }
    if (sortBy === 'word') {
      orderByClause = { word: 'asc' }
    }

    const [vocabularies, total] = await Promise.all([
      prisma.vocabularies.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
        include: Object.keys(includeOptions).length > 0 ? includeOptions : undefined,
      }),
      prisma.vocabularies.count({ where }),
    ])

    // 如果需要 R 开头的词汇优先，在应用层进行排序
    let sortedVocabularies = vocabularies
    if (rFirst) {
      sortedVocabularies = [...vocabularies].sort((a: any, b: any) => {
        const aStartsWithR = a.word.toLowerCase().startsWith('r')
        const bStartsWithR = b.word.toLowerCase().startsWith('r')
        if (aStartsWithR && !bStartsWithR) return -1
        if (!aStartsWithR && bStartsWithR) return 1
        return a.word.localeCompare(b.word)
      })
    }

    // 将 snake_case 映射为前端预期的 camelCase 字段
    // 注意：释义数据已完全迁移到 word_meanings 表
    const mapped = sortedVocabularies.map((vocab: any) => {
      const meanings = vocab.word_meanings || []
      const firstMeaning = meanings[0]


      const result: any = {
        id: vocab.id,
        word: vocab.word,
        // 从 word_meanings 获取词性和释义
        partOfSpeech: firstMeaning ? [firstMeaning.partOfSpeech] : [],
        primaryMeaning: firstMeaning?.meaning || '',
        secondaryMeaning: meanings[1]?.meaning || null,
        phonetic: vocab.phonetic || null,
        phoneticUS: vocab.phonetic_us || null,
        phoneticUK: vocab.phonetic_uk || null,
        audioUrl: vocab.audio_url || null,
        isHighFrequency: vocab.is_high_frequency || false,
        difficulty: vocab.difficulty || 'MEDIUM',
        createdAt: vocab.created_at,
        updatedAt: vocab.updated_at,
        // 始终返回 meanings 数组
        meanings: meanings.map((meaning: any) => ({
          id: meaning.id,
          partOfSpeech: meaning.partOfSpeech,
          meaning: meaning.meaning,
          orderIndex: meaning.orderIndex,
          examples: meaning.examples || [],
        })),
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

      // 映射图片数据
      if (vocab.word_images) {
        result.images = vocab.word_images.map((image: any) => ({
          id: image.id,
          imageUrl: image.imageUrl || image.image_url,
          description: image.description,
          createdAt: image.createdAt || image.created_at,
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

    // 验证: 必须使用新的 meanings 数组
    if (!word) {
      return errorResponse('请输入单词')
    }

    const hasMeanings = meanings && Array.isArray(meanings) && meanings.length > 0

    if (!hasMeanings) {
      return errorResponse('请添加至少一个释义')
    }

    // 检查单词是否已存在
    const existing = await prisma.vocabularies.findUnique({
      where: { word: word.toLowerCase() },
    })

    if (existing) {
      return errorResponse('该单词已存在')
    }

    const vocabId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 使用事务创建词汇和释义（释义存储在 word_meanings 表）
    const vocabulary = await prisma.$transaction(async (tx) => {
      // 创建词汇（不再使用旧的 part_of_speech, primary_meaning 字段）
      const vocab = await tx.vocabularies.create({
        data: {
          id: vocabId,
          word: word.toLowerCase(),
          phonetic,
          phonetic_us: phoneticUS,
          phonetic_uk: phoneticUK,
          is_high_frequency: isHighFrequency || false,
          difficulty: difficulty || 'MEDIUM',
          created_at: new Date(),
          updated_at: new Date(),
        },
      })

      // 创建多释义（释义数据存储在 word_meanings 表）
      await tx.word_meanings.createMany({
        data: meanings.map((m: any, index: number) => ({
          id: `wm_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          vocabularyId: vocabId,
          partOfSpeech: m.partOfSpeech,
          meaning: m.meaning,
          orderIndex: index,
          examples: m.examples || [],
        })),
      })

      // 创建音频
      if (audioUrlUS) {
        await tx.word_audios.create({
          data: {
            id: `wa_${Date.now()}_us_${Math.random().toString(36).substr(2, 9)}`,
            vocabularyId: vocabId,
            audioUrl: audioUrlUS,
            accent: 'US',
          },
        })
      }

      if (audioUrlUK) {
        await tx.word_audios.create({
          data: {
            id: `wa_${Date.now()}_uk_${Math.random().toString(36).substr(2, 9)}`,
            vocabularyId: vocabId,
            audioUrl: audioUrlUK,
            accent: 'UK',
          },
        })
      }

      // 创建图片
      if (imageUrl) {
        await tx.word_images.create({
          data: {
            id: `wi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            vocabularyId: vocabId,
            imageUrl: imageUrl,
            description: imageDescription,
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
