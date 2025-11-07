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
    partOfSpeech: [],
    primaryMeaning: null,
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
  
  // 提取词性和释义
  if (wordData.meanings && Array.isArray(wordData.meanings)) {
    const partOfSpeechSet = new Set()
    const definitions = []
    
    for (const meaning of wordData.meanings) {
      // 词性
      if (meaning.partOfSpeech) {
        let pos = meaning.partOfSpeech
        // 标准化词性缩写
        const posMap = {
          'noun': 'n.',
          'verb': 'v.',
          'adjective': 'adj.',
          'adverb': 'adv.',
          'pronoun': 'pron.',
          'preposition': 'prep.',
          'conjunction': 'conj.',
          'interjection': 'interj.',
        }
        pos = posMap[pos] || pos
        partOfSpeechSet.add(pos)
      }
      
      // 释义 (取前3个最重要的)
      if (meaning.definitions && Array.isArray(meaning.definitions)) {
        for (let i = 0; i < Math.min(3, meaning.definitions.length); i++) {
          if (meaning.definitions[i].definition) {
            definitions.push(meaning.definitions[i].definition)
          }
        }
      }
    }
    
    result.partOfSpeech = Array.from(partOfSpeechSet)
    result.primaryMeaning = definitions.slice(0, 2).join('; ') || null
  }
  
  return result
}

// 主函数
async function enrichVocabularyData() {
  try {
    console.log('🚀 开始补充词汇数据...\n')
    
    // 获取所有需要补充数据的单词
    const vocabularies = await prisma.vocabularies.findMany({
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
    
    console.log(`📚 找到 ${vocabularies.length} 个单词\n`)
    
    let processedCount = 0
    let updatedCount = 0
    let audioCount = 0
    let failedWords = []
    
    for (const vocab of vocabularies) {
      console.log(`\n[${processedCount + 1}/${vocabularies.length}] 处理: ${vocab.word}`)
      
      try {
        // 延迟请求避免API限流
        if (processedCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // 获取单词数据
        const apiData = await fetchWordData(vocab.word)
        const wordInfo = extractWordInfo(apiData)
        
        if (!wordInfo) {
          console.log('  ⚠️  无法提取数据')
          failedWords.push(vocab.word)
          processedCount++
          continue
        }
        
        // 准备更新数据
        const updateData = {}
        let hasUpdate = false
        
        // 词性和释义已经有中文数据，不更新
        // 只记录一下
        if (vocab.part_of_speech && vocab.part_of_speech.length > 0) {
          console.log(`  ✅ 已有词性: ${vocab.part_of_speech.join(', ')}`)
        }
        if (vocab.primary_meaning) {
          console.log(`  ✅ 已有释义: ${vocab.primary_meaning.substring(0, 30)}...`)
        }
        
        // 更新音标
        if (wordInfo.phoneticUS && !vocab.phonetic_us) {
          updateData.phonetic_us = wordInfo.phoneticUS
          console.log(`  ✅ 美式音标: ${wordInfo.phoneticUS}`)
          hasUpdate = true
        }
        
        if (wordInfo.phoneticUK && !vocab.phonetic_uk) {
          updateData.phonetic_uk = wordInfo.phoneticUK
          console.log(`  ✅ 英式音标: ${wordInfo.phoneticUK}`)
          hasUpdate = true
        }
        
        if (wordInfo.phonetic && !vocab.phonetic && !wordInfo.phoneticUS && !wordInfo.phoneticUK) {
          updateData.phonetic = wordInfo.phonetic
          console.log(`  ✅ 音标: ${wordInfo.phonetic}`)
          hasUpdate = true
        }
        
        // 执行更新
        if (hasUpdate) {
          updateData.updated_at = new Date()
          await prisma.vocabularies.update({
            where: { id: vocab.id },
            data: updateData
          })
          updatedCount++
        }
        
        // 添加音频
        if (wordInfo.audioUS) {
          const existingAudio = await prisma.word_audios.findFirst({
            where: { 
              vocabularyId: vocab.id,
              accent: 'US'
            }
          })
          
          if (!existingAudio) {
            await prisma.word_audios.create({
              data: {
                id: uuidv4(),
                vocabularyId: vocab.id,
                audioUrl: wordInfo.audioUS,
                accent: 'US',
                createdAt: new Date()
              }
            })
            console.log(`  ✅ 添加美式音频`)
            audioCount++
          }
        }
        
        if (wordInfo.audioUK) {
          const existingAudio = await prisma.word_audios.findFirst({
            where: { 
              vocabularyId: vocab.id,
              accent: 'UK'
            }
          })
          
          if (!existingAudio) {
            await prisma.word_audios.create({
              data: {
                id: uuidv4(),
                vocabularyId: vocab.id,
                audioUrl: wordInfo.audioUK,
                accent: 'UK',
                createdAt: new Date()
              }
            })
            console.log(`  ✅ 添加英式音频`)
            audioCount++
          }
        }
        
      } catch (error) {
        console.log(`  ❌ 失败: ${error.message}`)
        failedWords.push(vocab.word)
      }
      
      processedCount++
    }
    
    console.log('\n\n📊 处理完成统计:')
    console.log(`  处理单词: ${processedCount} 个`)
    console.log(`  更新数据: ${updatedCount} 个`)
    console.log(`  添加音频: ${audioCount} 个`)
    
    if (failedWords.length > 0) {
      console.log(`\n⚠️  失败的单词 (${failedWords.length}个):`)
      console.log(`  ${failedWords.join(', ')}`)
    }
    
  } catch (error) {
    console.error('\n❌ 处理过程出错:', error)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// 执行
enrichVocabularyData()
