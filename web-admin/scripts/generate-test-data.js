/**
 * 生成大数据量测试数据
 * 用于测试分页性能优化
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// 配置
const CONFIG = {
  vocabularies: 1000,  // 生成1000个词汇
  questionsPerVocab: 4, // 每个词汇4个题目
  optionsPerQuestion: 4, // 每个题目4个选项
  batchSize: 100,       // 批量插入大小
}

const questionTypes = ['ENGLISH_TO_CHINESE', 'CHINESE_TO_ENGLISH', 'LISTENING', 'FILL_IN_BLANK']
const difficulties = ['EASY', 'MEDIUM', 'HARD']
const partsOfSpeech = ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.']

function generateWord(index) {
  return `testword${index}`
}

function generateMeaning(word) {
  return `测试含义_${word}`
}

function generateSentence(word) {
  return `This is a test sentence with ${word}.`
}

function generateOptions(correctAnswer, type) {
  const options = [correctAnswer]
  
  // 生成3个错误选项
  for (let i = 1; i <= 3; i++) {
    if (type === 'ENGLISH_TO_CHINESE' || type === 'LISTENING') {
      options.push(`错误选项${i}`)
    } else {
      options.push(`wrong${i}`)
    }
  }
  
  // 打乱顺序
  return options.sort(() => Math.random() - 0.5)
}

async function generateVocabularies(startIndex, count) {
  const vocabularies = []
  
  for (let i = startIndex; i < startIndex + count; i++) {
    const word = generateWord(i)
    vocabularies.push({
      id: `v_test_${i}`,
      word,
      part_of_speech: [partsOfSpeech[Math.floor(Math.random() * partsOfSpeech.length)]],
      primary_meaning: generateMeaning(word),
      secondary_meaning: `次要含义_${word}`,
      phonetic: `/test${i}/`,
      phonetic_us: `/test${i}_us/`,
      phonetic_uk: `/test${i}_uk/`,
      is_high_frequency: Math.random() > 0.5,
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      created_at: new Date(),
      updated_at: new Date(),
    })
  }
  
  return vocabularies
}

async function generateQuestions(vocabularyId, vocabularyWord, startIndex) {
  const questions = []
  
  for (let i = 0; i < CONFIG.questionsPerVocab; i++) {
    const type = questionTypes[i % questionTypes.length]
    const questionId = `q_test_${startIndex}_${i}`
    
    let content, correctAnswer
    
    switch (type) {
      case 'ENGLISH_TO_CHINESE':
        content = vocabularyWord
        correctAnswer = generateMeaning(vocabularyWord)
        break
      case 'CHINESE_TO_ENGLISH':
        content = generateMeaning(vocabularyWord)
        correctAnswer = vocabularyWord
        break
      case 'LISTENING':
        content = '听音频选择正确的单词'
        correctAnswer = vocabularyWord
        break
      case 'FILL_IN_BLANK':
        content = `I need to ___ this ${vocabularyWord}.`
        correctAnswer = vocabularyWord
        break
    }
    
    const options = generateOptions(correctAnswer, type)
    
    questions.push({
      id: questionId,
      vocabularyId,
      type,
      content,
      sentence: generateSentence(vocabularyWord),
      audioUrl: type === 'LISTENING' ? `https://example.com/audio/${vocabularyWord}.mp3` : null,
      correctAnswer,
      createdAt: new Date(),
      updatedAt: new Date(),
      options: options.map((opt, idx) => ({
        id: `qo_test_${startIndex}_${i}_${idx}`,
        content: opt,
        isCorrect: opt === correctAnswer,
        order: idx,
        createdAt: new Date(),
      }))
    })
  }
  
  return questions
}

async function clearTestData() {
  console.log('🧹 清理旧的测试数据...')
  
  // 删除测试题目选项
  await prisma.question_options.deleteMany({
    where: {
      id: {
        startsWith: 'qo_test_'
      }
    }
  })
  
  // 删除测试题目
  await prisma.questions.deleteMany({
    where: {
      id: {
        startsWith: 'q_test_'
      }
    }
  })
  
  // 删除测试词汇
  await prisma.vocabularies.deleteMany({
    where: {
      id: {
        startsWith: 'v_test_'
      }
    }
  })
  
  console.log('✅ 清理完成')
}

async function main() {
  console.log('🚀 开始生成测试数据...')
  console.log(`📊 配置: ${CONFIG.vocabularies}个词汇, 每个${CONFIG.questionsPerVocab}个题目`)
  
  try {
    // 清理旧数据
    await clearTestData()
    
    // 分批生成词汇
    const totalBatches = Math.ceil(CONFIG.vocabularies / CONFIG.batchSize)
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const startIndex = batch * CONFIG.batchSize
      const count = Math.min(CONFIG.batchSize, CONFIG.vocabularies - startIndex)
      
      console.log(`\n📦 批次 ${batch + 1}/${totalBatches}: 生成 ${count} 个词汇...`)
      
      // 生成词汇数据
      const vocabularies = await generateVocabularies(startIndex, count)
      
      // 批量插入词汇
      await prisma.vocabularies.createMany({
        data: vocabularies,
        skipDuplicates: true,
      })
      
      console.log(`✅ 词汇插入完成`)
      
      // 生成并插入题目
      for (let i = 0; i < vocabularies.length; i++) {
        const vocab = vocabularies[i]
        const questionIndex = startIndex + i
        const questions = await generateQuestions(vocab.id, vocab.word, questionIndex)
        
        // 插入题目和选项
        for (const question of questions) {
          const { options, ...questionData } = question
          
          await prisma.questions.create({
            data: {
              ...questionData,
              question_options: {
                create: options
              }
            }
          })
        }
        
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`\r   题目进度: ${i + 1}/${vocabularies.length}`)
        }
      }
      
      console.log(`\n✅ 批次 ${batch + 1} 完成`)
    }
    
    // 统计结果
    const vocabCount = await prisma.vocabularies.count({
      where: { id: { startsWith: 'v_test_' } }
    })
    
    const questionCount = await prisma.questions.count({
      where: { id: { startsWith: 'q_test_' } }
    })
    
    const optionCount = await prisma.question_options.count({
      where: { id: { startsWith: 'qo_test_' } }
    })
    
    console.log('\n' + '='.repeat(50))
    console.log('✨ 测试数据生成完成!')
    console.log('='.repeat(50))
    console.log(`📚 词汇数量: ${vocabCount}`)
    console.log(`❓ 题目数量: ${questionCount}`)
    console.log(`📝 选项数量: ${optionCount}`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('❌ 生成失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 执行
main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
