/**
 * @file route.ts
 * @desc 批量获取单词发音并更新数据库
 * @input 依赖: Free Dictionary API, lib/db
 * @output 导出: POST /api/pronunciation/batch-update
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

interface DictionaryPhonetic {
  text?: string
  audio?: string
}

interface DictionaryResponse {
  word: string
  phonetic?: string
  phonetics?: DictionaryPhonetic[]
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
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以执行此操作')
    }

    const body = await request.json()
    const { prefix, limit = 50 } = body

    // 查询需要更新的单词（没有音频URL的）
    let query = `
      SELECT id, word FROM vocabularies
      WHERE audio_url IS NULL OR audio_url = ''
    `
    const params: unknown[] = []

    if (prefix) {
      query += ` AND word ILIKE $1`
      params.push(`${prefix}%`)
    }

    query += ` LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await db.query(query, params)
    const words = result.rows

    const updated: string[] = []
    const failed: string[] = []

    // 逐个获取发音并更新
    for (const row of words) {
      const pronunciation = await fetchPronunciation(row.word)

      if (pronunciation && (pronunciation.audioUS || pronunciation.audioUK)) {
        const audioUrl = pronunciation.audioUS || pronunciation.audioUK

        await db.query(
          `UPDATE vocabularies SET audio_url = $1 WHERE id = $2`,
          [audioUrl, row.id]
        )

        // 如果有美音，添加到 word_audios
        if (pronunciation.audioUS) {
          await db.query(
            `INSERT INTO word_audios (id, vocabulary_id, audio_url, accent, created_at)
             VALUES ($1, $2, $3, 'US', NOW())
             ON CONFLICT DO NOTHING`,
            [`wa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, row.id, pronunciation.audioUS]
          )
        }

        // 如果有英音，添加到 word_audios
        if (pronunciation.audioUK) {
          await db.query(
            `INSERT INTO word_audios (id, vocabulary_id, audio_url, accent, created_at)
             VALUES ($1, $2, $3, 'UK', NOW())
             ON CONFLICT DO NOTHING`,
            [`wa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, row.id, pronunciation.audioUK]
          )
        }

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
