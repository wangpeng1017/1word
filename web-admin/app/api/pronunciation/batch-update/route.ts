/**
 * @file route.ts
 * @desc 批量获取单词发音并更新数据库
 * @input 依赖: Free Dictionary API, lib/prisma
 * @output 导出: POST /api/pronunciation/batch-update
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

interface DictionaryPhonetic {
  text?: string
  audio?: string
}

interface DictionaryResponse {
  word: string
  phonetic?: string
  phonetics?: DictionaryPhonetics[]
}

async function fetchPronunciation(word: string): Promise<{
  phonetic?: string
  audioUS?: string
  audioUK?: string
} | null> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    )

    if (!response.ok) return null

    const data: DictionaryResponse[] = await response.json()
    const entry = data[0]
    const phonetics = entry.phonetics || []

    let usAudio = ''
    let ukAudio = ''
    let phonetic = entry.phonetic || ''

    for (const p of phonetics) {
      const audio = p.audio || ''
      if (audio.includes('-us') || audio.includes('_us')) {
        usAudio = audio
      } else if (audio.includes('-uk') || audio.includes('_gb') || audio.includes('-gb')) {
        ukAudio = audio
      } else if (audio && !usAudio) {
        usAudio = audio
      }
      if (p.text && !phonetic) {
        phonetic = p.text
      }
    }

    return { phonetic, audioUS: usAudio, audioUK: ukAudio }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')

    const payload = verifyToken(token || '')
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return unauthorizedResponse('只有教师或管理员可以执行此操作')
    }

    const body = await request.json()
    const { prefix, limit = 50 } = body

    // 1. 查询需要更新的单词
    // 使用 Prisma 查询，替代原生 SQL
    const where: any = {
      OR: [
        { audio_url: null },
        { audio_url: '' }
      ]
    }

    if (prefix) {
      where.word = {
        startsWith: prefix,
        mode: 'insensitive' // 替代 ILIKE
      }
    }

    const words = await prisma.vocabularies.findMany({
      where,
      take: Number(limit),
      select: { id: true, word: true }
    })

    const updated: string[] = []
    const failed: string[] = []

    // 逐个获取发音并更新
    for (const row of words) {
      const pronunciation = await fetchPronunciation(row.word)

      if (pronunciation && (pronunciation.audioUS || pronunciation.audioUK)) {
        const audioUrl = pronunciation.audioUS || pronunciation.audioUK

        // 更新词汇表的主音频
        await prisma.vocabularies.update({
          where: { id: row.id },
          data: { audio_url: audioUrl }
        })

        // 辅助函数：安全插入 word_audios
        const checkAndInsertAudio = async (url: string, accent: string) => {
          if (!url) return;
          // 检查是否存在
          const existing = await prisma.word_audios.findFirst({
            where: {
              vocabularyId: row.id,
              accent: accent
              // 注意：因为没有唯一约束，我们只能查是否存在。
              // 严格来说应该查 URL 是否相同，但为了简单起见，如果该词已有该口音音频，暂不重复插入
            }
          })

          if (!existing) {
            await prisma.word_audios.create({
              data: {
                id: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                vocabularyId: row.id,
                audioUrl: url,
                accent: accent
              }
            })
          }
        }

        // 如果有美音，添加到 word_audios
        await checkAndInsertAudio(pronunciation.audioUS || '', 'US')

        // 如果有英音，添加到 word_audios
        await checkAndInsertAudio(pronunciation.audioUK || '', 'UK')

        updated.push(row.word)
      } else {
        failed.push(row.word)
      }

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return successResponse({
      total: words.length,
      updated: updated.length,
      failed: failed.length,
      updatedWords: updated,
      failedWords: failed
    }, `成功更新 ${updated.length} 个单词的发音`)

  } catch (error) {
    console.error('批量更新发音错误:', error)
    return errorResponse('批量更新发音失败', 500)
  }
}
