/**
 * @file link-images.js
 * @desc 批量关联图片到数据库
 * @input 服务器图片目录: /root/word-app/web-admin/public/images/words/*.webp
 * @output 更新 word_images 表
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

const prisma = new PrismaClient()

// 配置
const IMAGES_DIR = path.join(__dirname, '../public/images/words')
const IMAGE_URL_PREFIX = '/images/words'

async function main() {
  console.log('=' .repeat(60))
  console.log('批量关联图片到数据库')
  console.log('=' .repeat(60))
  console.log(`图片目录: ${IMAGES_DIR}`)
  console.log()

  // 1. 检查目录
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('❌ 图片目录不存在:', IMAGES_DIR)
    process.exit(1)
  }

  // 2. 获取所有 webp 文件
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'))
  console.log(`找到 ${files.length} 个 WebP 文件`)

  // 3. 获取所有词汇（建立 word -> id 映射）
  const vocabularies = await prisma.vocabularies.findMany({
    select: { id: true, word: true }
  })
  const wordToId = new Map(vocabularies.map(v => [v.word.toLowerCase(), v.id]))
  console.log(`数据库词汇数: ${vocabularies.length}`)

  // 4. 获取已有图片记录
  const existingImages = await prisma.word_images.findMany({
    select: { vocabularyId: true }
  })
  const existingVocabIds = new Set(existingImages.map(i => i.vocabularyId))
  console.log(`已有图片记录: ${existingImages.length}`)
  console.log()

  // 5. 批量处理
  let added = 0
  let skipped = 0
  let notFound = 0
  const notFoundWords = []

  for (const file of files) {
    const word = path.basename(file, '.webp').toLowerCase()
    const vocabId = wordToId.get(word)

    if (!vocabId) {
      notFound++
      notFoundWords.push(word)
      continue
    }

    if (existingVocabIds.has(vocabId)) {
      skipped++
      continue
    }

    // 插入新记录
    try {
      await prisma.word_images.create({
        data: {
          id: randomUUID(),
          vocabularyId: vocabId,
          imageUrl: `${IMAGE_URL_PREFIX}/${file}`,
          description: null
        }
      })
      added++
      existingVocabIds.add(vocabId) // 避免重复

      if (added % 100 === 0) {
        console.log(`[${added}] 已添加...`)
      }
    } catch (err) {
      console.error(`❌ 添加失败: ${word} - ${err.message}`)
    }
  }

  // 6. 统计结果
  console.log()
  console.log('=' .repeat(60))
  console.log('完成！')
  console.log('=' .repeat(60))
  console.log(`新增图片记录: ${added}`)
  console.log(`已存在跳过: ${skipped}`)
  console.log(`未找到词汇: ${notFound}`)

  if (notFoundWords.length > 0 && notFoundWords.length <= 20) {
    console.log(`未匹配的单词: ${notFoundWords.join(', ')}`)
  }

  // 7. 最终统计
  const finalCount = await prisma.word_images.count()
  const vocabCount = await prisma.vocabularies.count()
  console.log()
  console.log(`图片覆盖率: ${finalCount}/${vocabCount} (${(finalCount/vocabCount*100).toFixed(1)}%)`)
}

main()
  .catch(e => {
    console.error('执行失败:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
