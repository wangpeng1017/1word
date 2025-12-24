import { list, del } from '@vercel/blob'

/**
 * 清理 Vercel Blob 存储中的所有文件
 */
async function cleanBlobStorage() {
    console.log('=========================================')
    console.log('  清理 Vercel Blob 存储')
    console.log('=========================================\n')

    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error('✗ 错误: 未找到 BLOB_READ_WRITE_TOKEN 环境变量')
            return
        }

        console.log('正在列出所有文件...\n')

        // 列出所有文件
        const { blobs } = await list()

        console.log(`找到 ${blobs.length} 个文件\n`)

        if (blobs.length === 0) {
            console.log('✓ Blob 存储已经是空的')
            return
        }

        // 显示文件信息
        let totalSize = 0
        blobs.forEach((blob, index) => {
            const sizeMB = (blob.size / 1024 / 1024).toFixed(2)
            totalSize += blob.size
            if (index < 10) {
                console.log(`  ${index + 1}. ${blob.pathname} (${sizeMB} MB)`)
            }
        })

        if (blobs.length > 10) {
            console.log(`  ... 还有 ${blobs.length - 10} 个文件`)
        }

        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)
        console.log(`\n总大小: ${totalSizeMB} MB\n`)

        console.log('开始删除文件...\n')

        let successCount = 0
        let failCount = 0

        // 删除所有文件
        for (let i = 0; i < blobs.length; i++) {
            const blob = blobs[i]
            try {
                await del(blob.url)
                successCount++

                if ((i + 1) % 100 === 0 || i === blobs.length - 1) {
                    console.log(`✓ 已删除 ${i + 1}/${blobs.length} 个文件`)
                }
            } catch (error) {
                failCount++
                console.error(`✗ 删除失败: ${blob.pathname}`, error instanceof Error ? error.message : error)
            }
        }

        console.log('\n=========================================')
        console.log('✓ 清理完成!')
        console.log(`  成功: ${successCount}`)
        console.log(`  失败: ${failCount}`)
        console.log(`  释放空间: ${totalSizeMB} MB`)
        console.log('=========================================\n')

        console.log('提示: 等待 5-10 分钟让删除操作完全生效，然后重新上传图片')

    } catch (error) {
        console.error('✗ 执行失败:', error)
    }
}

if (require.main === module) {
    cleanBlobStorage()
}

export { cleanBlobStorage }
