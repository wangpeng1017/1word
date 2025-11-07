const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    // 查询前10条数据
    const vocabularies = await prisma.vocabularies.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        word_audios: true
      }
    })
    
    console.log('\n📊 数据库中的词汇数据 (前10条):')
    console.log('='.repeat(80))
    
    for (const vocab of vocabularies) {
      console.log(`\n单词: ${vocab.word}`)
      console.log(`词性: ${vocab.part_of_speech?.join(', ') || '无'}`)
      console.log(`释义: ${vocab.primary_meaning || '无'}`)
      console.log(`音标: ${vocab.phonetic || vocab.phonetic_us || vocab.phonetic_uk || '无'}`)
      console.log(`音频: ${vocab.word_audios?.length || 0} 个`)
      console.log('-'.repeat(80))
    }
    
    // 统计总数
    const total = await prisma.vocabularies.count()
    console.log(`\n总计: ${total} 个单词`)
    
    // 统计有音频的单词数
    const withAudio = await prisma.vocabularies.count({
      where: {
        word_audios: {
          some: {}
        }
      }
    })
    console.log(`有音频: ${withAudio} 个单词`)
    console.log(`无音频: ${total - withAudio} 个单词`)
    
  } catch (error) {
    console.error('❌ 查询出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
