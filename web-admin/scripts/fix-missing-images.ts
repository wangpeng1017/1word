import { PrismaClient } from '@prisma/client'
import { put, list } from '@vercel/blob'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function fixMissingImages() {
    console.log('=========================================')
    console.log('  修复缺失的图片')
    console.log('=========================================\n')

    // 获取 Blob 中实际存在的文件
    const { blobs } = await list()
    const blobUrls = new Set(blobs.map(b => b.url))

    console.log(`Blob 存储中有 ${blobs.length} 个文件\n`)

    // 获取数据库中的图片记录
    const images = await prisma.word_images.findMany({
        include: {
            vocabularies: {
                select: { word: true }
            }
        }
    })

    console.log(`数据库中有 ${images.length} 条图片记录\n`)

    // 检查哪些图片 URL 失效
    const missingImages: any[] = []
    for (const img of images) {
        if (!blobUrls.has(img.imageUrl)) {
            missingImages.push(img)
        }
    }

    console.log(`缺失的图片: ${missingImages.length} 张\n`)

    if (missingImages.length === 0) {
        console.log('✓ 所有图片都已上传')
        await prisma.$disconnect()
        return
    }

    // 尝试重新上传缺失的图片
    const imagesDir = path.join(process.cwd(), '..', 'public', 'uploads', 'vocabulary-images')
    let successCount = 0
    let failCount = 0

    for (const img of missingImages) {
        const word = img.vocabularies.word
        const localPath = path.join(imagesDir, `${word}.png`)

        if (fs.existsSync(localPath)) {
            try {
                const fileBuffer = fs.readFileSync(localPath)
                const blob = await put(`vocabulary-images/${word}.png`, fileBuffer, {
                    access: 'public',
                    contentType: 'image/png'
                })

                // 更新数据库
                await prisma.word_images.update({
                    where: { id: img.id },
                    data: { imageUrl: blob.url }
                })

                successCount++
                console.log(`✓ [${successCount}] ${word}: 已上传`)
            } catch (error) {
                failCount++
                console.error(`✗ ${word}: 上传失败`, error instanceof Error ? error.message : '')
            }
        } else {
            failCount++
            console.log(`✗ ${word}: 本地文件不存在`)
        }
    }

    console.log('\n=========================================')
    console.log(`修复完成!`)
    console.log(`  成功: ${successCount}`)
    console.log(`  失败: ${failCount}`)
    console.log('=========================================')

    await prisma.$disconnect()
}

fixMissingImages()
