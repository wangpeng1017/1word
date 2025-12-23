/**
 * 修复音频URL格式问题
 * 问题：URL包含oxford域名前缀和双斜杠
 * 修复：清理为正确的相对路径格式
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAudioUrls() {
    try {
        console.log('=========================================')
        console.log('  修复音频URL格式')
        console.log('=========================================\n')

        // 查询所有音频记录
        const audios = await prisma.word_audios.findMany()
        console.log(`找到 ${audios.length} 条音频记录\n`)

        let fixedCount = 0
        let errorCount = 0

        for (const audio of audios) {
            try {
                let newUrl = audio.audioUrl

                // 移除oxford域名前缀
                if (newUrl.includes('oxford')) {
                    newUrl = newUrl.replace(/https?:\/\/[^\/]+\//, '/')
                }

                // 修复双斜杠
                newUrl = newUrl.replace(/\/\//g, '/')

                // 确保以/uploads开头
                if (!newUrl.startsWith('/uploads')) {
                    if (newUrl.includes('/uploads')) {
                        newUrl = newUrl.substring(newUrl.indexOf('/uploads'))
                    }
                }

                // 如果URL有变化，更新数据库
                if (newUrl !== audio.audioUrl) {
                    await prisma.word_audios.update({
                        where: { id: audio.id },
                        data: { audioUrl: newUrl }
                    })
                    fixedCount++

                    if (fixedCount <= 5) {
                        console.log(`修复: ${audio.audioUrl}`)
                        console.log(`  -> ${newUrl}\n`)
                    }
                }
            } catch (error) {
                errorCount++
                console.error(`修复失败: ${audio.id}`, error)
            }
        }

        console.log('=========================================')
        console.log('✓ 修复完成!')
        console.log(`  总计: ${audios.length}`)
        console.log(`  已修复: ${fixedCount}`)
        console.log(`  错误: ${errorCount}`)
        console.log('=========================================')

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    fixAudioUrls()
}
