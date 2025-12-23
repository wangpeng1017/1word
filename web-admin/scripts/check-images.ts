/**
 * 检查图片文件和路径
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function checkImages() {
    try {
        console.log('=========================================')
        console.log('  检查图片文件和路径')
        console.log('=========================================\n')

        // 查询所有图片记录
        const images = await prisma.word_images.findMany({
            include: {
                vocabularies: true
            }
        })

        console.log(`找到 ${images.length} 条图片记录\n`)

        const imageDir = path.join(process.cwd(), '..', 'public', 'uploads', 'vocabulary-images')
        console.log(`图片目录: ${imageDir}\n`)

        let existsCount = 0
        let missingCount = 0
        const missingFiles: string[] = []

        for (const image of images) {
            // 从URL提取文件名
            const filename = image.imageUrl.split('/').pop()
            if (!filename) continue

            const filepath = path.join(imageDir, filename)

            if (fs.existsSync(filepath)) {
                existsCount++
            } else {
                missingCount++
                missingFiles.push(`${image.vocabularies.word}: ${filename}`)

                if (missingFiles.length <= 10) {
                    console.log(`✗ 缺失: ${image.vocabularies.word} -> ${filename}`)
                }
            }
        }

        console.log('\n=========================================')
        console.log('✓ 检查完成!')
        console.log(`  总计: ${images.length}`)
        console.log(`  存在: ${existsCount}`)
        console.log(`  缺失: ${missingCount}`)
        console.log('=========================================')

        if (missingCount > 0) {
            console.log(`\n⚠ 有 ${missingCount} 个图片文件缺失`)
            console.log(`图片应该位于: ${imageDir}`)
        }

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    checkImages()
}
