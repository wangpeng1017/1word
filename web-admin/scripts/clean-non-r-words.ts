import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 删除非 R 开头单词的音频和图片数据
 */
async function cleanNonRWords() {
    console.log('=========================================')
    console.log('  清理非 R 开头单词的数据')
    console.log('=========================================\n')

    try {
        // 1. 删除非 R 开头单词的音频
        const deletedAudios = await prisma.word_audios.deleteMany({
            where: {
                vocabularies: {
                    word: {
                        not: {
                            startsWith: 'r'
                        }
                    }
                }
            }
        })

        console.log(`✓ 已删除 ${deletedAudios.count} 条音频记录（非 R 开头）`)

        // 2. 删除非 R 开头单词的图片
        const deletedImages = await prisma.word_images.deleteMany({
            where: {
                vocabularies: {
                    word: {
                        not: {
                            startsWith: 'r'
                        }
                    }
                }
            }
        })

        console.log(`✓ 已删除 ${deletedImages.count} 条图片记录（非 R 开头）`)

        // 3. 统计保留的数据
        const remainingAudios = await prisma.word_audios.count()
        const remainingImages = await prisma.word_images.count()

        console.log(`\n保留的数据：`)
        console.log(`  音频: ${remainingAudios} 条`)
        console.log(`  图片: ${remainingImages} 条`)

        // 4. 列出 R 开头的单词
        const rWords = await prisma.vocabularies.findMany({
            where: {
                word: {
                    startsWith: 'r'
                }
            },
            select: {
                word: true
            }
        })

        console.log(`\n✓ R 开头的单词共 ${rWords.length} 个`)
        if (rWords.length <= 20) {
            console.log('单词列表:')
            rWords.forEach(v => console.log(`  - ${v.word}`))
        } else {
            console.log('前 20 个单词:')
            rWords.slice(0, 20).forEach(v => console.log(`  - ${v.word}`))
            console.log(`  ... 还有 ${rWords.length - 20} 个`)
        }

        console.log('\n=========================================')
        console.log('✓ 清理完成!')
        console.log('=========================================\n')

    } catch (error) {
        console.error('✗ 执行失败:', error)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    cleanNonRWords()
}

export { cleanNonRWords }
