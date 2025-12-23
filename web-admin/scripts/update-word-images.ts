/**
 * 根据映射文件更新词汇图片
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ImageMapping {
    word: string
    image: string
    page: number
}

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function updateWordImages() {
    try {
        console.log('===========================================')
        console.log('  更新词汇图片')
        console.log('===========================================\n')

        // 读取映射文件
        const mappingPath = 'E:\\trae\\1word\\word_image_mapping_final.json'
        console.log(`读取映射文件: ${mappingPath}`)

        const mappingData = fs.readFileSync(mappingPath, 'utf-8')
        const mappings: ImageMapping[] = JSON.parse(mappingData)

        console.log(`✓ 成功读取 ${mappings.length} 条映射记录\n`)
        console.log('开始更新图片...\n')

        let successCount = 0
        let notFoundCount = 0
        let skipCount = 0
        let errorCount = 0

        for (let i = 0; i < mappings.length; i++) {
            const mapping = mappings[i]

            try {
                // 查找词汇
                const vocabulary = await prisma.vocabularies.findUnique({
                    where: { word: mapping.word },
                    include: { word_images: true }
                })

                if (!vocabulary) {
                    notFoundCount++
                    if (i % 100 === 0) {
                        console.log(`[${i + 1}/${mappings.length}] ${mapping.word} - 未找到词汇`)
                    }
                    continue
                }

                // 检查是否已有图片
                if (vocabulary.word_images && vocabulary.word_images.length > 0) {
                    skipCount++
                    continue
                }

                // 添加图片
                if (mapping.image && mapping.image.trim() !== '') {
                    const imageUrl = `/uploads/vocabulary-images/${mapping.image}`

                    await prisma.word_images.create({
                        data: {
                            id: generateId('image'),
                            vocabularyId: vocabulary.id,
                            imageUrl: imageUrl,
                            description: `${mapping.word}的图片`
                        }
                    })

                    successCount++

                    if ((i + 1) % 100 === 0) {
                        console.log(`进度: ${i + 1}/${mappings.length} (成功:${successCount}, 跳过:${skipCount}, 未找到:${notFoundCount})`)
                    }
                }

            } catch (error) {
                errorCount++
                console.error(`处理 ${mapping.word} 时出错:`, error instanceof Error ? error.message : error)
            }
        }

        console.log('\n===========================================')
        console.log('✓ 图片更新完成!')
        console.log(`  总计: ${mappings.length}`)
        console.log(`  成功: ${successCount}`)
        console.log(`  跳过(已有图片): ${skipCount}`)
        console.log(`  未找到词汇: ${notFoundCount}`)
        console.log(`  错误: ${errorCount}`)
        console.log('===========================================')

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    updateWordImages()
}
