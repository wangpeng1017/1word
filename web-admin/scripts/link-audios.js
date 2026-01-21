/**
 * @file link-audios.js
 * @desc 批量关联音频到数据库
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

const prisma = new PrismaClient()

const AUDIOS_DIR = path.join(__dirname, '../public/audios/words')
const AUDIO_URL_PREFIX = '/audios/words'

async function main() {
  console.log('=' .repeat(60))
  console.log('批量关联音频到数据库')
  console.log('=' .repeat(60))

  // 获取所有 mp3 文件
  const files = fs.readdirSync(AUDIOS_DIR).filter(f => f.endsWith('.mp3'))
  console.log(`找到 ${files.length} 个 MP3 文件`)

  // 获取词汇映射
  const vocabularies = await prisma.vocabularies.findMany({
    select: { id: true, word: true }
  })
  const wordToId = new Map(vocabularies.map(v => [v.word.toLowerCase(), v.id]))
  console.log(`数据库词汇数: ${vocabularies.length}`)

  // 获取已有音频记录
  const existingAudios = await prisma.word_audios.findMany({
    select: { vocabularyId: true }
  })
  const existingVocabIds = new Set(existingAudios.map(a => a.vocabularyId))
  console.log(`已有音频记录: ${existingAudios.length}`)
  console.log()

  let added = 0
  let skipped = 0
  let notFound = 0

  for (const file of files) {
    const word = path.basename(file, '.mp3').toLowerCase()
    const vocabId = wordToId.get(word)

    if (!vocabId) {
      notFound++
      continue
    }

    if (existingVocabIds.has(vocabId)) {
      skipped++
      continue
    }

    try {
      await prisma.word_audios.create({
        data: {
          id: randomUUID(),
          vocabularyId: vocabId,
          audioUrl: `${AUDIO_URL_PREFIX}/${file}`,
          accent: 'US'
        }
      })
      added++
      existingVocabIds.add(vocabId)

      if (added % 50 === 0) {
        console.log(`[${added}] 已添加...`)
      }
    } catch (err) {
      console.error(`❌ ${word}: ${err.message}`)
    }
  }

  console.log()
  console.log('=' .repeat(60))
  console.log('完成！')
  console.log('=' .repeat(60))
  console.log(`新增音频记录: ${added}`)
  console.log(`已存在跳过: ${skipped}`)
  console.log(`未找到词汇: ${notFound}`)

  const finalCount = await prisma.word_audios.count()
  const vocabCount = await prisma.vocabularies.count()
  console.log()
  console.log(`音频覆盖率: ${finalCount}/${vocabCount} (${(finalCount/vocabCount*100).toFixed(1)}%)`)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
