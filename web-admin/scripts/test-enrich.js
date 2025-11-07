const { PrismaClient } = require('@prisma/client')
const https = require('https')
const { v4: uuidv4 } = require('uuid')

const prisma = new PrismaClient()

// 使用Free Dictionary API获取单词信息
async function fetchWordData(word) {
  return new Promise((resolve, reject) => {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    
    https.get(url, (res) => {
      let data = ''
      
      res.on('data', chunk => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data)
            resolve(jsonData)
          } catch (error) {
            reject(new Error('解析JSON失败'))
          }
        } else {
          reject(new Error(`API返回错误: ${res.statusCode}`))
        }
      })
      
      res.on('error', reject)
    }).on('error', reject)
  })
}

// 从API响应中提取数据
function extractWordInfo(apiData) {
  if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
    return null
  }
  
  const wordData = apiData[0]
  const result = {
    phoneticUS: null,
    phoneticUK: null,
    phonetic: null,
    audioUS: null,
    audioUK: null,
  }
  
  // 提取音标
  if (wordData.phonetic) {
    result.phonetic = wordData.phonetic
  }
  
  if (wordData.phonetics && Array.isArray(wordData.phonetics)) {
    for (const phonetic of wordData.phonetics) {
      // 提取美式音标和音频
      if (phonetic.audio && phonetic.audio.includes('-us')) {
        result.phoneticUS = phonetic.text || result.phonetic
        result.audioUS = phonetic.audio
      }
      // 提取英式音标和音频
      else if (phonetic.audio && (phonetic.audio.includes('-uk') || phonetic.audio.includes('-gb'))) {
        result.phoneticUK = phonetic.text || result.phonetic
        result.audioUK = phonetic.audio
      }
      // 通用音频
      else if (phonetic.audio && !result.audioUS) {
        result.audioUS = phonetic.audio
        if (phonetic.text) {
          result.phoneticUS = phonetic.text
        }
      }
    }
  }
  
  return result
}

// 测试函数 - 只处理前5个单词
async function testEnrich() {
  try {
    console.log('🧪 测试脚本 - 只处理前5个单词\n')
    
    const vocabularies = await prisma.vocabularies.findMany({
      take: 5,
      select: {
        id: true,
        word: true,
        part_of_speech: true,
        primary_meaning: true,
        phonetic: true,
        phonetic_us: true,
        phonetic_uk: true,
      }
    })
    
    console.log(`📚 测试 ${vocabularies.length} 个单词\n`)
    
    for (let i = 0; i < vocabularies.length; i++) {
      const vocab = vocabularies[i]
      console.log(`\n[${i + 1}/${vocabularies.length}] 处理: ${vocab.word}`)
      console.log(`  当前词性: ${vocab.part_of_speech?.join(', ') || '无'}`)
      console.log(`  当前释义: ${vocab.primary_meaning || '无'}`)
      console.log(`  当前音标: ${vocab.phonetic || vocab.phonetic_us || vocab.phonetic_uk || '无'}`)
      
      try {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        const apiData = await fetchWordData(vocab.word)
        const wordInfo = extractWordInfo(apiData)
        
        if (!wordInfo) {
          console.log('  ⚠️  无法提取数据')
          continue
        }
        
        console.log(`\n  API返回数据:`)
        console.log(`    音标: ${wordInfo.phonetic || '无'}`)
        console.log(`    美式音标: ${wordInfo.phoneticUS || '无'}`)
        console.log(`    英式音标: ${wordInfo.phoneticUK || '无'}`)
        console.log(`    美式音频: ${wordInfo.audioUS || '无'}`)
        console.log(`    英式音频: ${wordInfo.audioUK || '无'}`)
        
        // 更新音标
        const updateData = {}
        let hasUpdate = false
        
        if (wordInfo.phoneticUS && !vocab.phonetic_us) {
          updateData.phonetic_us = wordInfo.phoneticUS
          hasUpdate = true
        }
        
        if (wordInfo.phoneticUK && !vocab.phonetic_uk) {
          updateData.phonetic_uk = wordInfo.phoneticUK
          hasUpdate = true
        }
        
        if (hasUpdate) {
          updateData.updated_at = new Date()
          await prisma.vocabularies.update({
            where: { id: vocab.id },
            data: updateData
          })
          console.log(`  ✅ 已更新音标`)
        }
        
        // 添加音频
        if (wordInfo.audioUS) {
          const existing = await prisma.word_audios.findFirst({
            where: { vocabularyId: vocab.id, accent: 'US' }
          })
          
          if (!existing) {
            await prisma.word_audios.create({
              data: {
                id: uuidv4(),
                vocabularyId: vocab.id,
                audioUrl: wordInfo.audioUS,
                accent: 'US',
                createdAt: new Date()
              }
            })
            console.log(`  ✅ 已添加美式音频`)
          } else {
            console.log(`  ⏭️  已有美式音频`)
          }
        }
        
        if (wordInfo.audioUK) {
          const existing = await prisma.word_audios.findFirst({
            where: { vocabularyId: vocab.id, accent: 'UK' }
          })
          
          if (!existing) {
            await prisma.word_audios.create({
              data: {
                id: uuidv4(),
                vocabularyId: vocab.id,
                audioUrl: wordInfo.audioUK,
                accent: 'UK',
                createdAt: new Date()
              }
            })
            console.log(`  ✅ 已添加英式音频`)
          } else {
            console.log(`  ⏭️  已有英式音频`)
          }
        }
        
      } catch (error) {
        console.log(`  ❌ 失败: ${error.message}`)
      }
    }
    
    console.log('\n\n✅ 测试完成!')
    
  } catch (error) {
    console.error('\n❌ 测试出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEnrich()
