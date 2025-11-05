const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkVocabularies() {
  try {
    console.log('📊 正在查询词汇数据...')
    console.log('数据库URL:', process.env.DATABASE_URL ? '已配置' : '未配置')
    
    const vocabularies = await prisma.vocabulary.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log(`\n✅ 找到 ${vocabularies.length} 条词汇记录:\n`)
    
    vocabularies.forEach((vocab, index) => {
      console.log(`${index + 1}. ${vocab.word}`)
      console.log(`   意思: ${vocab.primaryMeaning}`)
      console.log(`   难度: ${vocab.difficulty}`)
      console.log(`   创建时间: ${vocab.createdAt}`)
      console.log('')
    })
    
    const total = await prisma.vocabulary.count()
    console.log(`📈 总计: ${total} 条词汇`)
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message)
    console.error('详细错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVocabularies()
