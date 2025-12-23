/**
 * 复制图片文件到正确目录
 */

import * as fs from 'fs-extra'
import * as path from 'path'

async function copyImages() {
    try {
        console.log('=========================================')
        console.log('  复制图片文件')
        console.log('=========================================\n')

        const sourceDir = 'E:\\trae\\1word\\word_images_final'
        const targetDir = path.join(process.cwd(), '..', 'public', 'uploads', 'vocabulary-images')

        console.log(`源目录: ${sourceDir}`)
        console.log(`目标目录: ${targetDir}\n`)

        // 确保目标目录存在
        await fs.ensureDir(targetDir)
        console.log('✓ 目标目录已创建\n')

        // 获取源目录中的所有文件
        const files = await fs.readdir(sourceDir)
        console.log(`找到 ${files.length} 个文件\n`)

        let copiedCount = 0
        let skippedCount = 0
        let errorCount = 0

        for (const file of files) {
            try {
                const sourcePath = path.join(sourceDir, file)
                const targetPath = path.join(targetDir, file)

                // 检查是否是文件
                const stat = await fs.stat(sourcePath)
                if (!stat.isFile()) {
                    continue
                }

                // 检查目标文件是否已存在
                if (await fs.pathExists(targetPath)) {
                    skippedCount++
                    continue
                }

                // 复制文件
                await fs.copy(sourcePath, targetPath)
                copiedCount++

                if (copiedCount % 100 === 0) {
                    console.log(`进度: ${copiedCount}/${files.length}`)
                }

            } catch (error) {
                errorCount++
                console.error(`复制失败: ${file}`, error instanceof Error ? error.message : error)
            }
        }

        console.log('\n=========================================')
        console.log('✓ 复制完成!')
        console.log(`  总计: ${files.length}`)
        console.log(`  已复制: ${copiedCount}`)
        console.log(`  跳过(已存在): ${skippedCount}`)
        console.log(`  错误: ${errorCount}`)
        console.log('=========================================')

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    }
}

if (require.main === module) {
    copyImages()
}
