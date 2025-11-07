const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// 解析testword.md文件
function parseTestWords(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const words = []
  
  // 按## 分割每个单词块
  const wordBlocks = content.split(/## \d+\. /).filter(block => block.trim())
  
  for (const block of wordBlocks) {
    const lines = block.trim().split('\n')
    if (lines.length === 0) continue
    
    // 第一行是单词
    const word = lines[0].trim()
    
    // 查找释义行 (格式: **① 中文释义**)
    const meaningMatch = block.match(/\*\*① (.+?)\*\*/)
    const primaryMeaning = meaningMatch ? meaningMatch[1] : ''
    
    // 查找音标行 (格式: **② word/音标/**)
    const phoneticMatch = block.match(/\*\*② .+?\/(.+?)\/\*\*/)
    const phonetic = phoneticMatch ? phoneticMatch[1] : ''
    
    // 推断词性 (基于中文释义)
    let partOfSpeech = []
    if (primaryMeaning.includes('的')) {
      partOfSpeech.push('adj.')
    } else if (primaryMeaning.includes('地')) {
      partOfSpeech.push('adv.')
    } else {
      partOfSpeech.push('n.') // 默认名词
    }
    
    // 根据单词特征调整词性
    if (word.endsWith('ly')) {
      partOfSpeech = ['adv.']
    } else if (word.endsWith('tion') || word.endsWith('ment') || word.endsWith('ness') || word.endsWith('ty')) {
      partOfSpeech = ['n.']
    } else if (word.endsWith('ate') || word.endsWith('ize') || word.endsWith('ise')) {
      partOfSpeech = ['v.']
    } else if (word.endsWith('ful') || word.endsWith('ous') || word.endsWith('ive') || word.endsWith('able')) {
      partOfSpeech = ['adj.']
    }
    
    // 特殊单词的词性修正
    const verbWords = ['supply', 'rescue', 'engage', 'destroy', 'disappear', 'define', 'contrast', 'ban', 'announce', 'educate', 'elect', 'register', 'replicate', 'regulate', 'regard', 'persuade']
    const adjWords = ['specific', 'superior', 'annual', 'elderly', 'dull', 'enormous', 'reliable', 'accurate']
    
    if (verbWords.includes(word)) {
      partOfSpeech = ['v.']
    } else if (adjWords.includes(word)) {
      partOfSpeech = ['adj.']
    }
    
    // 设置难度 (基于单词长度和复杂度)
    let difficulty = 'MEDIUM'
    if (word.length <= 5) {
      difficulty = 'EASY'
    } else if (word.length >= 10) {
      difficulty = 'HARD'
    }
    
    // 判断是否高频词 (简单词通常是高频词)
    const isHighFrequency = word.length <= 6
    
    words.push({
      word: word.toLowerCase(),
      partOfSpeech,
      primaryMeaning,
      phonetic: phonetic || null,
      phoneticUS: null, // 音标统一处理
      phoneticUK: null,
      difficulty,
      isHighFrequency,
    })
  }
  
  return words
}

// 导入数据到数据库
async function importWords() {
  try {
    const testwordPath = path.join(__dirname, '../../testword.md')
    console.log('📖 读取文件:', testwordPath)
    
    if (!fs.existsSync(testwordPath)) {
      console.error('❌ 文件不存在:', testwordPath)
      return
    }
    
    const words = parseTestWords(testwordPath)
    console.log(`✅ 成功解析 ${words.length} 个单词`)
    
    let importedCount = 0
    let skippedCount = 0
    
    for (const wordData of words) {
      try {
        // 检查单词是否已存在
        const existing = await prisma.vocabularies.findUnique({
          where: { word: wordData.word }
        })
        
        if (existing) {
          console.log(`⏭️  跳过已存在的单词: ${wordData.word}`)
          skippedCount++
          continue
        }
        
        // 创建新单词
        await prisma.vocabularies.create({
          data: {
            word: wordData.word,
            partOfSpeech: wordData.partOfSpeech,
            primaryMeaning: wordData.primaryMeaning,
            phonetic: wordData.phonetic,
            phoneticUS: wordData.phoneticUS,
            phoneticUK: wordData.phoneticUK,
            difficulty: wordData.difficulty,
            isHighFrequency: wordData.isHighFrequency,
          }
        })
        
        console.log(`✅ 导入成功: ${wordData.word} - ${wordData.primaryMeaning}`)
        importedCount++
        
      } catch (error) {
        console.error(`❌ 导入失败: ${wordData.word}`, error.message)
      }
    }
    
    console.log('\n📊 导入统计:')
    console.log(`   新导入: ${importedCount} 个`)
    console.log(`   跳过: ${skippedCount} 个`)
    console.log(`   总计: ${words.length} 个`)
    
  } catch (error) {
    console.error('❌ 导入过程出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 执行导入
importWords()
