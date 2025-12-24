import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMissingAudios() {
    console.log('检查缺少音频的 R 开头词汇...\n')

    // 获取所有 R 开头的词汇
    const rVocabs = await prisma.vocabularies.findMany({
        where: { word: { startsWith: 'r' } },
        include: { word_audios: true },
        orderBy: { word: 'asc' }
    })

    const missingAudios: string[] = []

    for (const vocab of rVocabs) {
        if (vocab.word_audios.length === 0) {
            missingAudios.push(vocab.word)
        }
    }

    console.log(`R 开头词汇总数: ${rVocabs.length}`)
    console.log(`缺少音频的词汇: ${missingAudios.length}`)

    if (missingAudios.length > 0) {
        console.log('\n缺少音频的词汇列表:')
        missingAudios.forEach(w => console.log(`  - ${w}`))
    }

    await prisma.$disconnect()
}

checkMissingAudios()
