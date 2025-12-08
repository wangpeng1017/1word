/**
 * 修复旧 Oxford Dictionaries 音频链接
 *
 * 问题：部分音频使用了已失效的 oxforddictionaries.com 链接
 * 解决：转换为 Google 托管的 gstatic.com 链接
 *
 * 旧链接格式：
 *   http://www.oxforddictionaries.com/media/english/uk_pron/r/rep/repli/replicate__gb_1_8.mp3
 *
 * 新链接格式：
 *   https://ssl.gstatic.com/dictionary/static/sounds/oxford/replicate--_gb_1.mp3
 *
 * 用法:
 *   node scripts/fix-oxford-audio-urls.js [--limit 100] [--execute]
 *
 * 说明:
 * - 默认 dry-run（只打印不写库），加入 --execute 才会真正更新数据库
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * 将旧 Oxford 链接转换为新 Google 链接
 * @param {string} oldUrl - 旧的 oxforddictionaries.com 链接
 * @returns {string|null} - 新的 gstatic.com 链接，或 null（无法转换）
 */
function convertOxfordToGstatic(oldUrl) {
  // 匹配旧 Oxford 链接格式
  // 例如: http://www.oxforddictionaries.com/media/english/uk_pron/r/rep/repli/replicate__gb_1_8.mp3
  const oxfordPattern = /oxforddictionaries\.com\/media\/english\/(uk|us)_pron\/.*\/([a-zA-Z0-9_'-]+)__?(gb|us)_(\d+)(?:_\d+)?\.mp3/i

  const match = oldUrl.match(oxfordPattern)
  if (!match) {
    return null
  }

  const [, , word, accent, version] = match

  // 清理单词名（移除下划线等）
  const cleanWord = word.replace(/_/g, '').toLowerCase()

  // 构建新 URL
  // 格式: https://ssl.gstatic.com/dictionary/static/sounds/oxford/{word}--_{accent}_{version}.mp3
  const newAccent = accent === 'gb' ? 'gb' : 'us'
  const newUrl = `https://ssl.gstatic.com/dictionary/static/sounds/oxford/${cleanWord}--_${newAccent}_${version}.mp3`

  return newUrl
}

/**
 * 检查 URL 是否为旧 Oxford 链接
 */
function isOldOxfordUrl(url) {
  return url && url.includes('oxforddictionaries.com')
}

async function main() {
  const args = process.argv.slice(2)
  const limitIdx = args.indexOf('--limit')
  const doExecute = args.includes('--execute')
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] || '100', 10) : 100

  console.log('🔧 修复旧 Oxford Dictionaries 音频链接')
  console.log(`限制: ${limit} 条`)
  console.log(doExecute ? '⚠️  执行写入模式' : '🧪  模拟运行（不写库），加 --execute 才会写库')
  console.log('')

  try {
    // 1. 查找 word_audios 表中使用旧 Oxford 链接的记录
    const audioRecords = await prisma.word_audios.findMany({
      where: {
        audioUrl: {
          contains: 'oxforddictionaries.com'
        }
      },
      include: {
        vocabularies: {
          select: { word: true }
        }
      },
      take: limit
    })

    console.log(`📊 word_audios 表中找到 ${audioRecords.length} 条旧 Oxford 链接`)

    // 2. 查找 vocabularies 表中 audio_url 字段使用旧 Oxford 链接的记录
    const vocabRecords = await prisma.vocabularies.findMany({
      where: {
        audio_url: {
          contains: 'oxforddictionaries.com'
        }
      },
      select: { id: true, word: true, audio_url: true },
      take: limit
    })

    console.log(`📊 vocabularies 表中找到 ${vocabRecords.length} 条旧 Oxford 链接`)
    console.log('')

    let fixedAudios = 0
    let fixedVocabs = 0
    let failedAudios = 0
    let failedVocabs = 0

    // 3. 修复 word_audios 表
    if (audioRecords.length > 0) {
      console.log('--- 修复 word_audios 表 ---')
      for (const record of audioRecords) {
        const word = record.vocabularies?.word || 'unknown'
        const oldUrl = record.audioUrl
        const newUrl = convertOxfordToGstatic(oldUrl)

        console.log(`\n[${word}]`)
        console.log(`  旧: ${oldUrl}`)

        if (newUrl) {
          console.log(`  新: ${newUrl}`)

          if (doExecute) {
            try {
              await prisma.word_audios.update({
                where: { id: record.id },
                data: { audioUrl: newUrl }
              })
              console.log('  ✅ 已更新')
              fixedAudios++
            } catch (err) {
              console.log(`  ❌ 更新失败: ${err.message}`)
              failedAudios++
            }
          } else {
            fixedAudios++
          }
        } else {
          console.log('  ⚠️  无法转换，格式不匹配')
          failedAudios++
        }
      }
    }

    // 4. 修复 vocabularies 表的 audio_url 字段
    if (vocabRecords.length > 0) {
      console.log('\n--- 修复 vocabularies.audio_url 字段 ---')
      for (const record of vocabRecords) {
        const word = record.word
        const oldUrl = record.audio_url
        const newUrl = convertOxfordToGstatic(oldUrl)

        console.log(`\n[${word}]`)
        console.log(`  旧: ${oldUrl}`)

        if (newUrl) {
          console.log(`  新: ${newUrl}`)

          if (doExecute) {
            try {
              await prisma.vocabularies.update({
                where: { id: record.id },
                data: { audio_url: newUrl }
              })
              console.log('  ✅ 已更新')
              fixedVocabs++
            } catch (err) {
              console.log(`  ❌ 更新失败: ${err.message}`)
              failedVocabs++
            }
          } else {
            fixedVocabs++
          }
        } else {
          console.log('  ⚠️  无法转换，格式不匹配')
          failedVocabs++
        }
      }
    }

    // 5. 汇总
    console.log('\n' + '='.repeat(60))
    console.log('📊 结果汇总')
    console.log(`  word_audios 表: 修复 ${fixedAudios} 条, 失败 ${failedAudios} 条`)
    console.log(`  vocabularies 表: 修复 ${fixedVocabs} 条, 失败 ${failedVocabs} 条`)

    if (!doExecute) {
      console.log('\n💡 这是模拟运行，实际未修改数据库')
      console.log('   添加 --execute 参数来执行实际修复')
    }
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ 执行失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 测试转换函数
function testConversion() {
  const testUrls = [
    'http://www.oxforddictionaries.com/media/english/uk_pron/r/rep/repli/replicate__gb_1_8.mp3',
    'http://www.oxforddictionaries.com/media/english/us_pron/a/amb/ambit/ambitious__us_1.mp3',
    'http://www.oxforddictionaries.com/media/english/uk_pron/a/ada/adapt/adapt__gb_1.mp3',
  ]

  console.log('🧪 测试 URL 转换:')
  for (const url of testUrls) {
    const newUrl = convertOxfordToGstatic(url)
    console.log(`\n旧: ${url}`)
    console.log(`新: ${newUrl || '无法转换'}`)
  }
}

if (require.main === module) {
  // 如果带 --test 参数，只运行测试
  if (process.argv.includes('--test')) {
    testConversion()
  } else {
    main()
  }
}

module.exports = { convertOxfordToGstatic, isOldOxfordUrl }
