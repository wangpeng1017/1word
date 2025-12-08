const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const words = ['contrast', 'replicate']
  console.log('=== 小程序音频数据验证 ===\n')

  for (const word of words) {
    const vocab = await prisma.vocabularies.findFirst({
      where: { word },
      include: { word_audios: true }
    })

    const audios = vocab?.word_audios || []
    const audioUs = audios.find(a => a.accent === 'US')?.audioUrl
    const audioUk = audios.find(a => a.accent === 'UK')?.audioUrl
    const defaultAudio = audioUs || audioUk || vocab?.audio_url || null

    const isBlob = defaultAudio && defaultAudio.includes('vercel-storage.com')

    console.log(`[${word}]`)
    console.log(`  最终音频URL: ${defaultAudio ? defaultAudio.substring(0, 70) + '...' : 'null'}`)
    console.log(`  存储位置: ${isBlob ? '✅ Vercel Blob' : '❌ 外部URL'}`)
    console.log()
  }
}

main().finally(() => prisma.$disconnect())
