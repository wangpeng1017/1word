import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/response'

// 获取单个词汇详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const includeMeanings = searchParams.get('includeMeanings') !== 'false' // 默认包含
    const includeAudios = searchParams.get('includeAudios') === 'true'
    const includeImages = searchParams.get('includeImages') === 'true'
    
    const includeOptions: any = {}
    if (includeMeanings) {
      includeOptions.word_meanings = {
        orderBy: { orderIndex: 'asc' }
      }
    }
    if (includeAudios) {
      includeOptions.word_audios = {
        orderBy: { createdAt: 'asc' }
      }
    }
    if (includeImages) {
      includeOptions.word_images = {
        orderBy: { createdAt: 'asc' }
      }
    }
    
    const vocabulary = await prisma.vocabularies.findUnique({
      where: { id: params.id },
      include: Object.keys(includeOptions).length > 0 ? includeOptions : undefined,
    })

    if (!vocabulary) {
      return notFoundResponse('词汇不存在')
    }

    const { audio_url, created_at, updated_at, word_meanings, word_audios, word_images, ...rest } = vocabulary as any
    const result: any = { 
      ...rest, 
      audioUrl: audio_url ?? null, 
      createdAt: created_at, 
      updatedAt: updated_at 
    }
    
    // 映射多词性多释义
    if (word_meanings) {
      result.meanings = word_meanings.map((m: any) => ({
        id: m.id,
        partOfSpeech: m.partOfSpeech,
        meaning: m.meaning,
        orderIndex: m.orderIndex,
        examples: m.examples || [],
      }))
    }
    
    // 映射音频
    if (word_audios) {
      result.audios = word_audios.map((a: any) => ({
        id: a.id,
        audioUrl: a.audioUrl,
        accent: a.accent,
        duration: a.duration,
        createdAt: a.createdAt,
      }))
    }
    
    // 映射图片
    if (word_images) {
      result.images = word_images.map((i: any) => ({
        id: i.id,
        imageUrl: i.imageUrl,
        description: i.description,
        createdAt: i.createdAt,
      }))
    }
    
    return successResponse(result)
  } catch (error) {
    console.error('获取词汇详情错误:', error)
    return errorResponse('获取词汇详情失败', 500)
  }
}

// 更新词汇
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以更新词汇')
    }

    const body = await request.json()
    const {
      word,
      meanings,
      partOfSpeech, // 向后兼容
      primaryMeaning, // 向后兼容
      secondaryMeaning,
      phonetic,
      phoneticUS,
      phoneticUK,
      audioUrl, // deprecated
      audioUrlUS,
      audioUrlUK,
      imageUrl,
      imageDescription,
      isHighFrequency,
      difficulty,
    } = body

    // 使用事务更新词汇、释义、音频和图片
    const vocabulary = await prisma.$transaction(async (tx) => {
      // 更新词汇基本信息
      const updateData: any = {
        updated_at: new Date(),
      }
      
      if (word) updateData.word = word.toLowerCase()
      if (partOfSpeech) updateData.part_of_speech = partOfSpeech
      if (primaryMeaning) updateData.primary_meaning = primaryMeaning
      if (typeof secondaryMeaning !== 'undefined') updateData.secondary_meaning = secondaryMeaning
      if (typeof phonetic !== 'undefined') updateData.phonetic = phonetic
      if (typeof phoneticUS !== 'undefined') updateData.phonetic_us = phoneticUS
      if (typeof phoneticUK !== 'undefined') updateData.phonetic_uk = phoneticUK
      if (typeof isHighFrequency !== 'undefined') updateData.is_high_frequency = isHighFrequency
      if (difficulty) updateData.difficulty = difficulty
      if (typeof audioUrl !== 'undefined') updateData.audio_url = audioUrl // deprecated

      const vocab = await tx.vocabularies.update({
        where: { id: params.id },
        data: updateData,
      })
      
      // 更新多释义：删除旧的，创建新的
      if (meanings && Array.isArray(meanings)) {
        // 删除所有旧释义
        await tx.word_meanings.deleteMany({
          where: { vocabulary_id: params.id },
        })
        
        // 创建新释义
        if (meanings.length > 0) {
          await tx.word_meanings.createMany({
            data: meanings.map((m: any, index: number) => ({
              id: `wm_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              vocabulary_id: params.id,
              part_of_speech: m.partOfSpeech,
              meaning: m.meaning,
              order_index: index,
              examples: m.examples || [],
              created_at: new Date(),
              updated_at: new Date(),
            })),
          })
        }
      }
      
      // 更新音频
      if (typeof audioUrlUS !== 'undefined') {
        // 删除旧的 US 音频
        await tx.word_audios.deleteMany({
          where: { vocabulary_id: params.id, accent: 'US' },
        })
        // 创建新的
        if (audioUrlUS) {
          await tx.word_audios.create({
            data: {
              id: `wa_${Date.now()}_us_${Math.random().toString(36).substr(2, 9)}`,
              vocabulary_id: params.id,
              audio_url: audioUrlUS,
              accent: 'US',
              created_at: new Date(),
              updated_at: new Date(),
            },
          })
        }
      }
      
      if (typeof audioUrlUK !== 'undefined') {
        // 删除旧的 UK 音频
        await tx.word_audios.deleteMany({
          where: { vocabulary_id: params.id, accent: 'UK' },
        })
        // 创建新的
        if (audioUrlUK) {
          await tx.word_audios.create({
            data: {
              id: `wa_${Date.now()}_uk_${Math.random().toString(36).substr(2, 9)}`,
              vocabulary_id: params.id,
              audio_url: audioUrlUK,
              accent: 'UK',
              created_at: new Date(),
              updated_at: new Date(),
            },
          })
        }
      }
      
      // 更新图片
      if (typeof imageUrl !== 'undefined') {
        // 删除旧图片
        await tx.word_images.deleteMany({
          where: { vocabulary_id: params.id },
        })
        // 创建新图片
        if (imageUrl) {
          await tx.word_images.create({
            data: {
              id: `wi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              vocabulary_id: params.id,
              image_url: imageUrl,
              description: imageDescription,
              created_at: new Date(),
              updated_at: new Date(),
            },
          })
        }
      }
      
      return vocab
    })

    const { audio_url, created_at, updated_at, ...rest } = vocabulary as any
    return successResponse({ ...rest, audioUrl: audio_url ?? null, createdAt: created_at, updatedAt: updated_at }, '词汇更新成功')
  } catch (error) {
    console.error('更新词汇错误:', error)
    return errorResponse('更新词汇失败', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以删除词汇')
    }

    await prisma.vocabularies.delete({
      where: { id: params.id },
    })

    return successResponse(null, '词汇删除成功')
  } catch (error) {
    console.error('删除词汇错误:', error)
    return errorResponse('删除词汇失败', 500)
  }
}
