/**
 * 验证修复效果
 * 检查underlie等单词的释义是否正确
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyFixes() {
    try {
        console.log('=========================================')
        console.log('  验证修复效果')
        console.log('=========================================\n')

        // 测试单词列表
        const testWords = ['underlie', 'underline', 'undermine', 'undertake', 'union']

        for (const word of testWords) {
            const vocab = await prisma.vocabularies.findUnique({
                where: { word },
                include: {
                    word_meanings: {
                        orderBy: { orderIndex: 'asc' }
                    },
                    word_audios: true,
                    word_images: true
                }
            })

            if (!vocab) {
                console.log(`✗ 未找到单词: ${word}\n`)
                continue
            }

            console.log(`\n单词: ${word}`)
            console.log(`词性: ${vocab.part_of_speech.join(', ')}`)
            console.log(`主要释义: ${vocab.primary_meaning}`)

            console.log(`\n详细释义:`)
            for (const meaning of vocab.word_meanings) {
                console.log(`  ${meaning.partOfSpeech} ${meaning.meaning}`)
            }

            console.log(`\n音频: ${vocab.word_audios.length}个`)
            for (const audio of vocab.word_audios) {
                console.log(`  ${audio.accent}: ${audio.audioUrl}`)
            }

            console.log(`\n图片: ${vocab.word_images.length}个`)
            for (const image of vocab.word_images) {
                console.log(`  ${image.imageUrl}`)
            }

            console.log('\n' + '='.repeat(50))
        }

        // 统计总体情况
        const totalVocabs = await prisma.vocabularies.count()
        const totalMeanings = await prisma.word_meanings.count()
        const totalAudios = await prisma.word_audios.count()
        const totalImages = await prisma.word_images.count()

        console.log('\n\n总体统计:')
        console.log(`  词汇总数: ${totalVocabs}`)
        console.log(`  释义总数: ${totalMeanings}`)
        console.log(`  音频总数: ${totalAudios}`)
        console.log(`  图片总数: ${totalImages}`)

    } catch (error) {
        console.error('\n✗ 验证失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    verifyFixes()
}
