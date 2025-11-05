const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addVocabulary() {
  try {
    console.log('📚 添加测试词汇...\n')
    
    const vocabulary = await prisma.vocabulary.create({
      data: {
        word: 'ambitious',
        partOfSpeech: ['adj.'],
        primaryMeaning: '有雄心的；有野心的',
        secondaryMeaning: '费力的；耗资的；耗时的',
        phonetic: '/æmˈbɪʃəs/',
        phoneticUS: '/æmˈbɪʃəs/',
        phoneticUK: '/æmˈbɪʃəs/',
        isHighFrequency: true,
        difficulty: 'MEDIUM',
      }
    })
    
    console.log('✅ 词汇添加成功：')
    console.log(`   单词: ${vocabulary.word}`)
    console.log(`   词性: ${vocabulary.partOfSpeech.join(', ')}`)
    console.log(`   释义: ${vocabulary.primaryMeaning}`)
    console.log(`   音标: ${vocabulary.phonetic}`)
    console.log(`   难度: ${vocabulary.difficulty}`)
    console.log(`   高频词: ${vocabulary.isHighFrequency ? '是' : '否'}`)
    
  } catch (error) {
    console.error('❌ 添加失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addVocabulary()
