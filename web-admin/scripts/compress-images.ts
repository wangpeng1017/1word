import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

/**
 * 批量压缩图片
 * 将图片压缩到合适的大小以适应 Vercel Blob 1GB 限制
 */
async function compressImages() {
    console.log('=========================================')
    console.log('  批量压缩图片')
    console.log('=========================================\n')

    const sourceDir = path.join(process.cwd(), '..', 'public', 'uploads', 'vocabulary-images')
    const targetDir = path.join(sourceDir, 'compressed')

    // 检查源目录
    if (!fs.existsSync(sourceDir)) {
        console.error(`✗ 错误: 源目录不存在: ${sourceDir}`)
        return
    }

    // 创建目标目录
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
        console.log(`✓ 创建目标目录: ${targetDir}\n`)
    }

    // 获取所有 PNG 文件
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.png'))
    console.log(`找到 ${files.length} 张图片\n`)

    if (files.length === 0) {
        console.log('没有需要压缩的图片')
        return
    }

    let successCount = 0
    let failCount = 0
    let totalOriginalSize = 0
    let totalCompressedSize = 0

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const sourcePath = path.join(sourceDir, file)
        const targetPath = path.join(targetDir, file)

        try {
            // 获取原始文件大小
            const originalStats = fs.statSync(sourcePath)
            totalOriginalSize += originalStats.size

            // 压缩图片
            await sharp(sourcePath)
                .resize(800, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .png({
                    quality: 80,
                    compressionLevel: 9,
                    effort: 10
                })
                .toFile(targetPath)

            // 获取压缩后文件大小
            const compressedStats = fs.statSync(targetPath)
            totalCompressedSize += compressedStats.size

            const reduction = ((1 - compressedStats.size / originalStats.size) * 100).toFixed(1)

            successCount++

            if ((i + 1) % 100 === 0 || i === files.length - 1) {
                console.log(`[${i + 1}/${files.length}] ${file}: ${formatBytes(originalStats.size)} → ${formatBytes(compressedStats.size)} (减少 ${reduction}%)`)
            }

        } catch (error) {
            failCount++
            console.error(`✗ [${i + 1}/${files.length}] ${file}: 压缩失败`, error instanceof Error ? error.message : error)
        }
    }

    const totalReduction = ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1)

    console.log('\n=========================================')
    console.log('✓ 压缩完成!')
    console.log(`  成功: ${successCount}`)
    console.log(`  失败: ${failCount}`)
    console.log(`  原始大小: ${formatBytes(totalOriginalSize)}`)
    console.log(`  压缩后: ${formatBytes(totalCompressedSize)}`)
    console.log(`  减少: ${totalReduction}%`)
    console.log('=========================================\n')

    console.log('下一步:')
    console.log('1. 备份原始图片（可选）')
    console.log('2. 替换原始图片: mv compressed/* . && rmdir compressed')
    console.log('3. 清理 Vercel Blob 存储')
    console.log('4. 重新运行上传脚本')
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

if (require.main === module) {
    compressImages()
}

export { compressImages }
