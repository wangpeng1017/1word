/**
 * 将已有音频迁移到 Vercel Blob，并更新 word_audios.audioUrl
 * 用法：
 *   node scripts/migrate-audio-to-blob.js --limit 50 --from 0 --execute
 */
const { PrismaClient } = require('@prisma/client')
const { put } = require('@vercel/blob')
const https = require('https')
const http = require('http')
const { URL } = require('url')

const prisma = new PrismaClient()

function get(url) {
  return url.startsWith('https') ? https : http
}

/**
 * 下载远程资源，支持重定向与简单请求头
 */
async function download(url, opts = {}) {
  const {
    maxRedirects = 5,
    timeoutMs = 15000,
    redirectCount = 0,
  } = opts

  return new Promise((resolve, reject) => {
    const client = get(url)
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
        'Accept': 'audio/*,application/octet-stream,*/*;q=0.8',
      },
    }, (res) => {
      // 处理重定向
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        if (redirectCount >= maxRedirects) {
          reject(new Error(`重定向过多 (${redirectCount})`))
          return
        }
        const location = res.headers.location
        if (!location) {
          reject(new Error('收到重定向但没有 Location 头'))
          return
        }
        const nextUrl = new URL(location, url).toString()
        res.resume() // 丢弃响应体
        resolve(download(nextUrl, { maxRedirects, timeoutMs, redirectCount: redirectCount + 1 }))
        return
      }

      if (res.statusCode !== 200) {
        reject(new Error(`下载失败 ${res.statusCode}`))
        return
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        if (buf.length === 0) {
          reject(new Error('下载到的内容为空'))
          return
        }
        resolve(buf)
      })
      res.on('error', reject)
    })

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('请求超时'))
    })

    req.on('error', reject)
  })
}

function isBlobUrl(url) {
  return typeof url === 'string' && /vercel-storage\.com\//.test(url)
}

async function main() {
  const args = process.argv.slice(2)
  const limitIdx = args.indexOf('--limit')
  const fromIdx = args.indexOf('--from')
  const execute = args.includes('--execute')
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx+1] || '50', 10) : 50
  const offset = fromIdx >= 0 ? parseInt(args[fromIdx+1] || '0', 10) : 0

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // 尝试从 .env.local 加载（web-admin 目录）
    try {
      require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
    } catch {}
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // 进一步尝试从项目根目录加载 .env 或 .env.local（不打印任何机密）
    try {
      const path = require('path')
      require('dotenv').config({ path: path.join(__dirname, '../../.env.local') })
      require('dotenv').config({ path: path.join(__dirname, '../../.env') })
    } catch {}
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ 缺少 BLOB_READ_WRITE_TOKEN 环境变量')
    process.exit(1)
  }

  console.log('🚚 迁移音频到 Vercel Blob')
  console.log(`范围: offset=${offset}, limit=${limit}`)
  console.log(execute ? '⚠️  执行写入模式' : '🧪 模拟模式（不写库）')

  try {
    const rows = await prisma.vocabularies.findMany({
      skip: offset,
      take: limit,
      select: {
        id: true,
        word: true,
        word_audios: { select: { id: true, audioUrl: true, accent: true } },
      },
      orderBy: { word: 'asc' },
    })

    let migrated = 0, skipped = 0, failed = 0

    for (let i = 0; i < rows.length; i++) {
      const v = rows[i]
      const audios = v.word_audios || []
      if (audios.length === 0) { skipped++; continue }

      // US 优先
      const audio = audios.find(a => a.accent === 'US') || audios[0]
      const srcUrl = audio.audioUrl
      if (!srcUrl) { skipped++; continue }
      if (isBlobUrl(srcUrl)) { console.log(`[${i+1}/${rows.length}] ${v.word} 已是Blob，跳过`); skipped++; continue }

      console.log(`\n[${i+1}/${rows.length}] ${v.word} (${audio.accent})`)
      console.log(`  源: ${srcUrl}`)

      try {
        // 下载（处理重定向）
        const buf = await download(srcUrl)
        console.log(`  ⬇️ ${Math.round(buf.length/1024)}KB`)
        const filename = `audio/words/${v.word.toLowerCase()}_${(audio.accent||'US').toUpperCase()}.mp3`

        if (!execute) { migrated++; continue }

        // 上传
        const blob = await put(filename, buf, { access: 'public', addRandomSuffix: false, contentType: 'audio/mpeg' })
        console.log(`  ⬆️ ${blob.url}`)

        // 更新DB
        await prisma.word_audios.update({ where: { id: audio.id }, data: { audioUrl: blob.url } })
        console.log('  ✅ 已更新数据库')
        migrated++
      } catch (e) {
        console.log(`  ❌ 失败: ${e.message}`)
        failed++
      }

      if (i < rows.length - 1) {
        await new Promise(r => setTimeout(r, 120))
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`迁移完成：新增(更新) ${migrated}，跳过 ${skipped}，失败 ${failed}`)
  } catch (e) {
    console.error('❌ 执行失败:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}
