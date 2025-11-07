const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// 解析testword.md文件
function parseTestWords(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const wordsMap = new Map()
  
  // 按## 分割每个单词块
  const wordBlocks = content.split(/## \d+\. /).filter(block => block.trim())
  
  for (const block of wordBlocks) {
    const lines = block.trim().split('\n')
    if (lines.length === 0) continue
    
    // 第一行是单词
    const word = lines[0].trim().toLowerCase()
    
    // 跳过非单词行
    if (word.includes('#') || word.includes('答案') || word.length > 20) continue
    
    // 查找释义行 (格式: **① 中文释义**)
    const meaningMatch = block.match(/\*\*① (.+?)\*\*/)
    const primaryMeaning = meaningMatch ? meaningMatch[1] : ''
    
    // 查找音标行 (格式: **② word/音标/**)
    const phoneticMatch = block.match(/\*\*② .+?\/(.+?)\/\*\*/)
    const phonetic = phoneticMatch ? phoneticMatch[1] : ''
    
    // 推断词性
    let partOfSpeech = []
    
    // 特殊单词的词性定义
    const wordPoS = {
      // 名词
      'refugee': ['n.'], 'supply': ['n.', 'v.'], 'region': ['n.'], 'sunset': ['n.'],
      'species': ['n.'], 'resident': ['n.'], 'policy': ['n.'], 'electricity': ['n.'],
      'edge': ['n.'], 'phrase': ['n.'], 'flow': ['n.', 'v.'], 'drill': ['n.', 'v.'],
      'personality': ['n.'], 'entertainment': ['n.'], 'distinction': ['n.'],
      'flavour': ['n.'], 'cycle': ['n.', 'v.'], 'contrast': ['n.', 'v.'], 'coal': ['n.'],
      'ambition': ['n.'], 'admission': ['n.'], 'agency': ['n.'], 'entry': ['n.'],
      'employment': ['n.'], 'encouragement': ['n.'], 'ecology': ['n.'], 'edition': ['n.'],
      
      // 动词
      'rescue': ['v.', 'n.'], 'engage': ['v.'], 'persuade': ['v.'], 'destroy': ['v.'],
      'disappear': ['v.'], 'define': ['v.'], 'ban': ['v.', 'n.'], 'announce': ['v.'],
      'educate': ['v.'], 'elect': ['v.'], 'register': ['v.', 'n.'], 'replicate': ['v.'],
      'regulate': ['v.'], 'regard': ['v.', 'n.'],
      
      // 形容词
      'specific': ['adj.'], 'superior': ['adj.', 'n.'], 'annual': ['adj.'],
      'elderly': ['adj.'], 'dull': ['adj.'], 'enormous': ['adj.'], 'reliable': ['adj.'],
      'accurate': ['adj.'],
      
      // 名词(特殊)
      'acid': ['n.', 'adj.']
    }
    
    if (wordPoS[word]) {
      partOfSpeech = wordPoS[word]
    } else if (word.endsWith('ly')) {
      partOfSpeech = ['adv.']
    } else if (word.endsWith('tion') || word.endsWith('ment') || word.endsWith('ness') || word.endsWith('ty')) {
      partOfSpeech = ['n.']
    } else if (word.endsWith('ate') || word.endsWith('ize') || word.endsWith('ise')) {
      partOfSpeech = ['v.']
    } else if (word.endsWith('ful') || word.endsWith('ous') || word.endsWith('ive') || word.endsWith('able')) {
      partOfSpeech = ['adj.']
    } else {
      partOfSpeech = ['n.']
    }
    
    wordsMap.set(word, {
      word,
      partOfSpeech,
      primaryMeaning,
      phonetic: phonetic || null,
    })
  }
  
  return wordsMap
}

// 更新数据库中的数据
async function updateWords() {
  try {
    const testwordPath = path.join(__dirname, '../../testword.md')
    console.log('📖 读取文件:', testwordPath)
    
    if (!fs.existsSync(testwordPath)) {
      console.error('❌ 文件不存在:', testwordPath)
      return
    }
    
    const wordsMap = parseTestWords(testwordPath)
    console.log(`✅ 成功解析 ${wordsMap.size} 个单词`)
    
    let updatedCount = 0
    let skippedCount = 0
    
    for (const [word, wordData] of wordsMap.entries()) {
      try {
        // 查找现有单词
        const existing = await prisma.vocabularies.findUnique({
          where: { word }
        })
        
        if (!existing) {
          console.log(`⏭️  单词不存在: ${word}`)
          skippedCount++
          continue
        }
        
        // 更新单词数据
        await prisma.vocabularies.update({
          where: { word },
          data: {
            part_of_speech: wordData.partOfSpeech,
            primary_meaning: wordData.primaryMeaning,
            phonetic: wordData.phonetic,
            updated_at: new Date(),
          }
        })
        
        console.log(`✅ 更新成功: ${word} - ${wordData.partOfSpeech.join(', ')} - ${wordData.primaryMeaning}`)
        updatedCount++
        
      } catch (error) {
        console.error(`❌ 更新失败: ${word}`, error.message)
      }
    }
    
    console.log('\n📊 更新统计:')
    console.log(`   已更新: ${updatedCount} 个`)
    console.log(`   跳过: ${skippedCount} 个`)
    console.log(`   总计: ${wordsMap.size} 个`)
    
  } catch (error) {
    console.error('❌ 更新过程出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 执行更新
updateWords()
