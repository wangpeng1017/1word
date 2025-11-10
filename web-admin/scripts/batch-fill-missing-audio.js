/**
 * 批量补齐缺失音频（基于 word_audios 表）
 *
 * 用法:
 *   node scripts/batch-fill-missing-audio.js [--limit 500] [--from <offset>] [--execute]
 *   
 * 说明:
 * - 默认 dry-run（只打印不写库），加入 --execute 才会真正写入数据库
 * - 会优先使用 thousandlemons 数据源（gstatic Oxford 音源的相对路径）
 * - 只为没有任何音频记录的词创建一条 US 口音的音频记录
 */

const { PrismaClient } = require('@prisma/client')
const { downloadAudioData, loadAudioData, buildFullAudioUrl } = require('./fetch-audio-data')

const prisma = new PrismaClient()

function genId(prefix = 'wa') {
  const r = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now()}_${r}`
}

async function main() {
  const args = process.argv.slice(2)
  const limitIdx = args.indexOf('--limit')
  const fromIdx = args.indexOf('--from')
  const doExecute = args.includes('--execute')
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] || '500', 10) : 500
  const offset = fromIdx >= 0 ? parseInt(args[fromIdx + 1] || '0', 10) : 0

  console.log('🚀 批量补齐缺失音频')
  console.log(`范围: offset=${offset}, limit=${limit}`)
  console.log(doExecute ? '⚠️  执行写入模式' : '🧪  模拟运行（不写库），加 --execute 才会写库')

  try {
    // 准备数据源
    try {
      await downloadAudioData()
    } catch (e) {
      console.log('ℹ️  使用已有的本地 audio-data.json')
    }
    const audioMap = loadAudioData()
    if (!audioMap) {
      console.error('❌ 未找到音频映射数据')
      process.exit(1)
    }

    // 查缺音频的词
    const words = await prisma.vocabularies.findMany({
      where: { word_audios: { none: {} } },
      select: { id: true, word: true },
      skip: offset,
      take: limit,
      orderBy: { word: 'asc' },
    })

    console.log(`📚 需要补齐音频的词数: ${words.length}`)
    if (words.length === 0) return

    let created = 0
    let skipped = 0
    let notFound = 0

    for (let i = 0; i < words.length; i++) {
      const { id: vocabularyId, word } = words[i]
      const key = (word || '').toLowerCase()
      const partial = audioMap[key]

      console.log(`\n[${i + 1}/${words.length}] ${word}`)

      if (!partial) {
        console.log('  ⚠️  数据源未找到音频')
        notFound++
        continue
      }

      const audioUrl = buildFullAudioUrl(partial)
      console.log(`  源URL: ${audioUrl}`)

      if (!doExecute) {
        created++
        continue
      }

      try {
        await prisma.word_audios.create({
          data: {
            id: genId('wa'),
            vocabularyId,
            audioUrl,
            accent: 'US',
          },
        })
        console.log('  ✅ 已创建 US 音频记录')
        created++
      } catch (err) {
        console.log(`  ❌ 写入失败: ${err.message}`)
        skipped++
      }

      // 轻微限速
      if (i < words.length - 1) {
        await new Promise((r) => setTimeout(r, 50))
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 结果汇总')
    console.log(`  新增: ${created}`)
    console.log(`  跳过: ${skipped}`)
    console.log(`  数据源未命中: ${notFound}`)
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
