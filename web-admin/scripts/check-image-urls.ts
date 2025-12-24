import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkImageUrls() {
    console.log('检查图片 URL...\n')

    const images = await prisma.word_images.findMany({
        take: 10,
        include: {
            vocabularies: {
                select: { word: true }
            }
        }
    })

    console.log('=== 图片 URL 示例 ===')
    for (const img of images) {
        console.log(`${img.vocabularies.word}: ${img.imageUrl}`)
    }

    // 检查是否有非 blob URL
    const blobImages = await prisma.word_images.count({
        where: {
            imageUrl: {
                startsWith: 'https://'
            }
        }
    })

    const localImages = await prisma.word_images.count({
        where: {
            imageUrl: {
                startsWith: '/'
            }
        }
    })

    console.log(`\nBlob URL 图片: ${blobImages}`)
    console.log(`本地路径图片: ${localImages}`)

    await prisma.$disconnect()
}

checkImageUrls()
