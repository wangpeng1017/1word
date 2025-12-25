/**
 * 匹配 R 开头单词的图片 URL 到现有 Vercel Blob 存储
 * 基于文件名匹配，更新数据库中的图片 URL
 */

import { PrismaClient } from '@prisma/client'
import { list } from '@vercel/blob'

const prisma = new PrismaClient()

async function matchRWordImages() {
    console.log('=========================================')
    console.log('  匹配 R 开头单词图片到 Blob URL')
    console.log('=========================================\n')

    try {
        // 检查环境变量
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error('✗ 错误: 未找到 BLOB_READ_WRITE_TOKEN 环境变量')
            return
        }

        // 获取 Blob 存储中的所有图片
        console.log('正在获取 Blob 存储中的图片列表...')
        const blobs: { url: string; pathname: string }[] = []
        let cursor: string | undefined

        do {
            const result = await list({ cursor, prefix: 'vocabulary-images/' })
            blobs.push(...result.blobs.map(b => ({ url: b.url, pathname: b.pathname })))
            cursor = result.cursor
        } while (cursor)

        console.log(`✓ 找到 ${blobs.length} 个 Blob 图片\n`)

        // 创建文件名到 URL 的映射
        const blobMap = new Map<string, string>()
        for (const blob of blobs) {
            // 提取文件名（不含路径）
            const fileName = blob.pathname.split('/').pop()?.toLowerCase()
            if (fileName) {
                blobMap.set(fileName, blob.url)
            }
        }

        // 获取所有 R 开头单词的图片记录（需要更新的）
        const images = await prisma.word_images.findMany({
            where: {
                vocabularies: {
                    word: { startsWith: 'r' }
                },
                // 只获取还没有更新到 Blob URL 的记录
                NOT: {
                    imageUrl: { contains: 'vercel-storage.com' }
                }
            },
            include: {
                vocabularies: {
                    select: { word: true }
                }
            }
        })

        console.log(`找到 ${images.length} 条需要更新的图片记录\n`)

        if (images.length === 0) {
            console.log('✓ 所有图片已经是 Blob URL，无需更新')
            return
        }

        let successCount = 0
        let failCount = 0

        for (let i = 0; i < images.length; i++) {
            const image = images[i]
            const word = image.vocabularies.word

            // 从现有 URL 提取文件名
            const fileName = image.imageUrl.split('/').pop()?.toLowerCase()

            if (!fileName) {
                failCount++
                console.log(`✗ [${i + 1}/${images.length}] ${word}: 无法解析文件名`)
                continue
            }

            // 在 Blob 中查找匹配的 URL
            const blobUrl = blobMap.get(fileName)

            if (!blobUrl) {
                failCount++
                console.log(`✗ [${i + 1}/${images.length}] ${word}: Blob 中未找到 ${fileName}`)
                continue
            }

            // 更新数据库
            await prisma.word_images.update({
                where: { id: image.id },
                data: { imageUrl: blobUrl }
            })

            successCount++
            console.log(`✓ [${i + 1}/${images.length}] ${word}: 已匹配 -> ${blobUrl.substring(0, 60)}...`)
        }

        console.log('\n=========================================')
        console.log('✓ 图片匹配完成!')
        console.log(`  成功匹配: ${successCount}`)
        console.log(`  未找到: ${failCount}`)
        console.log('=========================================\n')

    } catch (error) {
        console.error('✗ 执行失败:', error)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    matchRWordImages()
}

export { matchRWordImages }
