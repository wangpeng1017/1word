/**
 * 修复失效音频并迁移到 Vercel Blob
 *
 * 功能：
 * 1. 查找所有非 Blob 存储的音频
 * 2. 从可靠源（gstatic）下载音频
 * 3. 上传到 Vercel Blob
 * 4. 更新数据库
 *
 * 用法:
 *   node scripts/fix-and-migrate-audio.js [--limit 100] [--execute]
 */

const { PrismaClient } = require('@prisma/client')
const { put } = require('@vercel/blob')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// 加载本地音频映射数据
function loadAudioData() {
  const dataFile = path.join(__dirname, '../data/audio-data.json')
  if (!fs.existsSync(dataFile)) {
    console.error('❌ 未找到 audio-data.json，请先运行 npm run data:fetch-audio')
    return null
  }
  return JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
}

/**
 * 从 thousandlemons 数据中获取可靠的音频URL
 */
function getReliableAudioUrl(word, audioData) {
  const key = word.toLowerCase()
  const url = audioData[key]

  if (!url) return null

  // 如果是 gstatic URL，直接使用
  if (url.includes('gstatic.com')) {
    return url
  }

  // 如果是旧 Oxford URL，转换为 gstatic
  if (url.includes('oxforddictionaries.com')) {
    // 提取单词和口音信息
    const match = url.match(/\/([a-zA-Z_'-]+)__?(gb|us)_(\d+)(?:_\d+)?\.mp3/i)
    if (match) {
      const [, wordPart, accent, version] = match
      const cleanWord = wordPart.replace(/_/g, '').toLowerCase()
      return `https://ssl.gstatic.com/dictionary/static/sounds/oxford/${cleanWord}--_${accent}_${version}.mp3`
    }
  }

  // 其他 URL 尝试直接使用
  return url
}

/**
 * 下载音频文件
 */
async function downloadAudio(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'audio/*,*/*',
      },
    }, (res) => {
      // 处理重定向
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const location = res.headers.location
        if (location) {
          res.resume()
          resolve(downloadAudio(location, timeoutMs))
          return
        }
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        if (buffer.length < 1000) {
          reject(new Error('文件太小，可能不是有效音频'))
          return
        }
        resolve(buffer)
      })
      res.on('error', reject)
    })

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('请求超时'))
    })
    req.on('error', reject)
  })
}

/**
 * 检查是否为 Vercel Blob URL
 */
function isBlobUrl(url) {
  return url && url.includes('vercel-storage.com')
}

async function main() {
  const args = process.argv.slice(2)
  const limitIdx = args.indexOf('--limit')
  const execute = args.includes('--execute')
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] || '100', 10) : 100

  // 加载环境变量
  try {
    require('dotenv').config({ path: path.join(__dirname, '../.env.local') })
  } catch {}

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ 缺少 BLOB_READ_WRITE_TOKEN 环境变量')
    process.exit(1)
  }

  console.log('🔧 修复失效音频并迁移到 Vercel Blob')
  console.log(`限制: ${limit} 条`)
  console.log(execute ? '⚠️  执行写入模式' : '🧪  模拟运行（不写库）')
  console.log('')

  // 加载音频映射数据
  const audioData = loadAudioData()
  if (!audioData) {
    process.exit(1)
  }
  console.log(`📚 加载了 ${Object.keys(audioData).length} 个单词的音频映射`)

  try {
    // 查找所有非 Blob 存储的音频记录
    const audios = await prisma.word_audios.findMany({
      where: {
        NOT: {
          audioUrl: { contains: 'vercel-storage.com' }
        }
      },
      include: {
        vocabularies: { select: { word: true } }
      },
      take: limit
    })

    console.log(`\n📊 找到 ${audios.length} 条需要迁移的音频记录`)

    let migrated = 0
    let failed = 0
    let skipped = 0

    for (let i = 0; i < audios.length; i++) {
      const audio = audios[i]
      const word = audio.vocabularies?.word || 'unknown'
      const currentUrl = audio.audioUrl

      console.log(`\n[${i + 1}/${audios.length}] ${word}`)
      console.log(`  当前: ${currentUrl.substring(0, 60)}...`)

      // 获取可靠的音频源
      let sourceUrl = getReliableAudioUrl(word, audioData)

      if (!sourceUrl) {
        console.log('  ⚠️  未找到可靠音频源，跳过')
        skipped++
        continue
      }

      // 如果源URL和当前URL相同且不是失效的URL，尝试直接使用当前URL
      if (currentUrl === sourceUrl || isBlobUrl(currentUrl)) {
        console.log('  ⚠️  已是最新或Blob URL，跳过')
        skipped++
        continue
      }

      console.log(`  源URL: ${sourceUrl.substring(0, 60)}...`)

      try {
        // 下载音频
        const buffer = await downloadAudio(sourceUrl)
        console.log(`  ⬇️  下载成功: ${Math.round(buffer.length / 1024)}KB`)

        if (!execute) {
          migrated++
          continue
        }

        // 上传到 Vercel Blob
        const filename = `audio/words/${word.toLowerCase()}_${audio.accent || 'US'}.mp3`
        const blob = await put(filename, buffer, {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'audio/mpeg'
        })
        console.log(`  ⬆️  上传成功: ${blob.url}`)

        // 更新数据库
        await prisma.word_audios.update({
          where: { id: audio.id },
          data: { audioUrl: blob.url }
        })
        console.log('  ✅ 数据库已更新')
        migrated++

      } catch (err) {
        console.log(`  ❌ 失败: ${err.message}`)
        failed++
      }

      // 限速
      if (i < audios.length - 1) {
        await new Promise(r => setTimeout(r, 200))
      }
    }

    // 同时处理 vocabularies.audio_url 字段
    console.log('\n--- 检查 vocabularies.audio_url 字段 ---')

    const vocabs = await prisma.vocabularies.findMany({
      where: {
        audio_url: { not: null },
        NOT: {
          audio_url: { contains: 'vercel-storage.com' }
        }
      },
      select: { id: true, word: true, audio_url: true },
      take: limit
    })

    console.log(`找到 ${vocabs.length} 条需要处理的 vocabularies.audio_url`)

    for (let i = 0; i < vocabs.length; i++) {
      const vocab = vocabs[i]
      console.log(`\n[${i + 1}/${vocabs.length}] ${vocab.word}`)
      console.log(`  当前: ${vocab.audio_url?.substring(0, 60)}...`)

      // 查找对应的 word_audios 记录
      const wordAudio = await prisma.word_audios.findFirst({
        where: { vocabularyId: vocab.id }
      })

      if (wordAudio && isBlobUrl(wordAudio.audioUrl)) {
        // 使用 word_audios 中的 Blob URL 更新 vocabularies.audio_url
        if (execute) {
          await prisma.vocabularies.update({
            where: { id: vocab.id },
            data: { audio_url: wordAudio.audioUrl }
          })
          console.log(`  ✅ 已同步为: ${wordAudio.audioUrl.substring(0, 50)}...`)
        } else {
          console.log(`  将同步为: ${wordAudio.audioUrl.substring(0, 50)}...`)
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 结果汇总')
    console.log(`  迁移成功: ${migrated}`)
    console.log(`  跳过: ${skipped}`)
    console.log(`  失败: ${failed}`)

    if (!execute) {
      console.log('\n💡 这是模拟运行，添加 --execute 参数执行实际迁移')
    }
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}
