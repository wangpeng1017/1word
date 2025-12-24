import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkRWordData() {
    console.log('检查 R 开头词汇的数据状态...\n')

    const totalVocabs = await prisma.vocabularies.count()
    const rVocabs = await prisma.vocabularies.count({ where: { word: { startsWith: 'r' } } })

    const totalAudios = await prisma.word_audios.count()
    const rAudios = await prisma.word_audios.count({
        where: { vocabularies: { word: { startsWith: 'r' } } }
    })

    const totalImages = await prisma.word_images.count()
    const rImages = await prisma.word_images.count({
        where: { vocabularies: { word: { startsWith: 'r' } } }
    })

    console.log('=== 数据库统计 ===')
    console.log(`总词汇: ${totalVocabs}`)
    console.log(`R开头词汇: ${rVocabs}`)
    console.log(`总音频: ${totalAudios}`)
    console.log(`R开头音频: ${rAudios}`)
    console.log(`总图片: ${totalImages}`)
    console.log(`R开头图片: ${rImages}`)

    // 查看几个 R 开头词汇的详细信息
    const sampleRWords = await prisma.vocabularies.findMany({
        where: { word: { startsWith: 'r' } },
        take: 5,
        include: {
            word_audios: true,
            word_images: true,
            word_meanings: true
        }
    })

    console.log('\n=== R开头词汇示例 ===')
    for (const v of sampleRWords) {
        console.log(`\n${v.word}:`)
        console.log(`  音频数: ${v.word_audios.length}`)
        if (v.word_audios.length > 0) {
            console.log(`  音频URL: ${v.word_audios[0].audioUrl?.substring(0, 50)}...`)
        }
        console.log(`  图片数: ${v.word_images.length}`)
        if (v.word_images.length > 0) {
            console.log(`  图片URL: ${v.word_images[0].imageUrl?.substring(0, 50)}...`)
        }
        console.log(`  释义数: ${v.word_meanings.length}`)
    }

    await prisma.$disconnect()
}

checkRWordData()
