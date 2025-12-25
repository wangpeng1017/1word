/**
 * @file route.ts
 * @desc 获取单词发音（音标+音频URL）- 调用 Free Dictionary API
 * @input 依赖: Free Dictionary API (dictionaryapi.dev)
 * @output 导出: GET /api/pronunciation/[word]
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/response'

interface DictionaryPhonetic {
  text?: string
  audio?: string
  sourceUrl?: string
}

interface DictionaryResponse {
  word: string
  phonetic?: string
  phonetics?: DictionaryPhonetic[]
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ word: string }> }
) {
  const params = await context.params
  try {
    const word = params.word.toLowerCase().trim()

    if (!word) {
      return errorResponse('单词不能为空', 400)
    }

    // 调用 Free Dictionary API
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      {
        next: { revalidate: 86400 } // 缓存 24 小时
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return errorResponse('未找到该单词的发音', 404)
      }
      return errorResponse('获取发音失败', response.status)
    }

    const data: DictionaryResponse[] = await response.json()
    const entry = data[0]

    // 提取音标和音频
    const phonetics = entry.phonetics || []

    // 找美音和英音
    let usAudio = ''
    let ukAudio = ''
    let usPhonetic = ''
    let ukPhonetic = ''
    let defaultPhonetic = entry.phonetic || ''

    for (const p of phonetics) {
      const audio = p.audio || ''
      const text = p.text || ''

      if (audio.includes('-us') || audio.includes('_us')) {
        usAudio = audio
        if (text) usPhonetic = text
      } else if (audio.includes('-uk') || audio.includes('_gb') || audio.includes('-gb')) {
        ukAudio = audio
        if (text) ukPhonetic = text
      } else if (audio && !usAudio) {
        // 默认作为美音
        usAudio = audio
        if (text && !usPhonetic) usPhonetic = text
      }

      // 记录任何可用的音标
      if (text && !defaultPhonetic) {
        defaultPhonetic = text
      }
    }

    return successResponse({
      word: entry.word,
      phonetic: defaultPhonetic,
      phoneticUS: usPhonetic || defaultPhonetic,
      phoneticUK: ukPhonetic || defaultPhonetic,
      audioUS: usAudio,
      audioUK: ukAudio,
      // 原始数据，以防需要更多细节
      rawPhonetics: phonetics.map(p => ({
        text: p.text,
        audio: p.audio
      }))
    })

  } catch (error) {
    console.error('获取发音错误:', error)
    return errorResponse('获取发音失败', 500)
  }
}
