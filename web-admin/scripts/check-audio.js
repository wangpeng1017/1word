const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAudio() {
  try {
    // 检查register单词的音频
    const vocab = await prisma.vocabularies.findFirst({
      where: { word: 'register' },
      include: { word_audios: true }
    })
    
    console.log('\n📊 register单词数据:')
    console.log(JSON.stringify(vocab, null, 2))
    
    // 统计有音频的单词
    const allVocabs = await prisma.vocabularies.findMany({
      include: { word_audios: true },
      take: 10
    })
    
    console.log('\n\n前10个单词的音频情况:')
    for (const v of allVocabs) {
      console.log(`${v.word}: ${v.word_audios.length} 个音频`)
      v.word_audios.forEach(a => {
        console.log(`  - ${a.accent}: ${a.audio_url}`)
      })
    }
    
  } catch (error) {
    console.error('错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAudio()
