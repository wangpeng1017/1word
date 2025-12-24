/**
 * 将本地图片上传到 Vercel Blob 存储
 * 并更新数据库中的图片 URL
 */

import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function uploadImagesToBlob() {
    console.log('=========================================')
    console.log('  上传图片到 Vercel Blob')
    console.log('=========================================\n')

    try {
        // 检查环境变量
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error('✗ 错误: 未找到 BLOB_READ_WRITE_TOKEN 环境变量')
            console.log('\n请在 Vercel 项目中启用 Blob 存储:')
            console.log('1. 访问 Vercel Dashboard')
            console.log('2. 选择项目 -> Storage -> Create Database')
            console.log('3. 选择 Blob')
            console.log('4. 复制 BLOB_READ_WRITE_TOKEN 到 .env.local')
            return
        }

        // 获取所有图片记录
        const images = await prisma.word_images.findMany({
            include: {
                vocabularies: {
                    select: { word: true }
                }
            }
        })

        console.log(`找到 ${images.length} 条图片记录\n`)

        if (images.length === 0) {
            console.log('✓ 没有需要上传的图片')
            return
        }

        let successCount = 0
        let failCount = 0
        let skippedCount = 0

        for (let i = 0; i < images.length; i++) {
            const image = images[i]
            const word = image.vocabularies.word

            try {
                // 如果已经是 Blob URL，跳过
                if (image.imageUrl.startsWith('https://') && image.imageUrl.includes('vercel-storage.com')) {
                    skippedCount++
                    if ((i + 1) % 100 === 0) {
                        console.log(`[${i + 1}/${images.length}] ${word}: 已是 Blob URL，跳过`)
                    }
                    continue
                }

                // 构建本地文件路径
                const localPath = path.join(
                    process.cwd(),
                    '..',
                    'public',
                    image.imageUrl.replace(/^\//, '')
                )

                // 检查文件是否存在
                if (!fs.existsSync(localPath)) {
                    failCount++
                    console.log(`✗ [${i + 1}/${images.length}] ${word}: 文件不存在 (${localPath})`)
                    continue
                }

                // 读取文件
                const fileBuffer = fs.readFileSync(localPath)
                const fileName = path.basename(image.imageUrl)

                // 上传到 Vercel Blob
                const blob = await put(`vocabulary-images/${fileName}`, fileBuffer, {
                    access: 'public',
                    contentType: 'image/png'
                })

                // 更新数据库
                await prisma.word_images.update({
                    where: { id: image.id },
                    data: { imageUrl: blob.url }
                })

                successCount++
                console.log(`✓ [${i + 1}/${images.length}] ${word}: 已上传 -> ${blob.url}`)

                // 每 10 个图片暂停一下
                if ((i + 1) % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 500))
                }

            } catch (error) {
                failCount++
                console.error(`✗ [${i + 1}/${images.length}] ${word}: 上传失败`, error instanceof Error ? error.message : error)
            }
        }

        console.log('\n=========================================')
        console.log('✓ 图片上传完成!')
        console.log(`  成功: ${successCount}`)
        console.log(`  失败: ${failCount}`)
        console.log(`  跳过: ${skippedCount}`)
        console.log('=========================================\n')

    } catch (error) {
        console.error('✗ 执行失败:', error)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    uploadImagesToBlob()
}

export { uploadImagesToBlob }
