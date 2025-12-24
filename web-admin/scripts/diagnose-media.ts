import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

/**
 * 诊断音频和图片数据
 */
async function diagnose() {
    console.log('=========================================')
    console.log('  音频和图片数据诊断')
    console.log('=========================================\n')

    try {
        // 1. 检查词汇总数
        const totalVocabs = await prisma.vocabularies.count()
        console.log(`✓ 词汇总数: ${totalVocabs}`)

        // 2. 检查音频记录
        const totalAudios = await prisma.word_audios.count()
        console.log(`✓ 音频记录数: ${totalAudios}`)

        if (totalAudios > 0) {
            const audiosByAccent = await prisma.word_audios.groupBy({
                by: ['accent'],
                _count: true
            })
            console.log('  音频分布:')
            audiosByAccent.forEach(item => {
                console.log(`    - ${item.accent}: ${item._count} 条`)
            })

            // 示例音频记录
            const sampleAudios = await prisma.word_audios.findMany({
                take: 3,
                include: {
                    vocabularies: {
                        select: { word: true }
                    }
                }
            })
            console.log('  示例音频记录:')
            sampleAudios.forEach(audio => {
                console.log(`    - ${audio.vocabularies.word} (${audio.accent}): ${audio.audioUrl}`)
            })
        } else {
            console.log('  ⚠️  警告: 没有音频记录!')
        }

        // 3. 检查图片记录
        const totalImages = await prisma.word_images.count()
        console.log(`\n✓ 图片记录数: ${totalImages}`)

        if (totalImages > 0) {
            // 示例图片记录
            const sampleImages = await prisma.word_images.findMany({
                take: 5,
                include: {
                    vocabularies: {
                        select: { word: true }
                    }
                }
            })
            console.log('  示例图片记录:')
            sampleImages.forEach(image => {
                console.log(`    - ${image.vocabularies.word}: ${image.imageUrl}`)
            })

            // 检查图片文件是否存在
            console.log('\n  检查图片文件:')
            let existCount = 0
            let missingCount = 0

            for (const image of sampleImages) {
                // 尝试多个可能的路径
                const possiblePaths = [
                    path.join(process.cwd(), '..', 'public', image.imageUrl),
                    path.join(process.cwd(), 'public', image.imageUrl),
                    path.join(process.cwd(), '..', image.imageUrl.replace(/^\//, '')),
                ]

                let found = false
                for (const filePath of possiblePaths) {
                    if (fs.existsSync(filePath)) {
                        console.log(`    ✓ ${image.vocabularies.word}: 文件存在 (${filePath})`)
                        existCount++
                        found = true
                        break
                    }
                }

                if (!found) {
                    console.log(`    ✗ ${image.vocabularies.word}: 文件不存在 (${image.imageUrl})`)
                    missingCount++
                }
            }

            console.log(`\n  图片文件检查结果: ${existCount} 个存在, ${missingCount} 个缺失`)
        } else {
            console.log('  ⚠️  警告: 没有图片记录!')
        }

        // 4. 检查有音频和图片的词汇数
        const vocabsWithAudios = await prisma.vocabularies.count({
            where: {
                word_audios: {
                    some: {}
                }
            }
        })

        const vocabsWithImages = await prisma.vocabularies.count({
            where: {
                word_images: {
                    some: {}
                }
            }
        })

        console.log(`\n✓ 有音频的词汇数: ${vocabsWithAudios} / ${totalVocabs} (${((vocabsWithAudios / totalVocabs) * 100).toFixed(1)}%)`)
        console.log(`✓ 有图片的词汇数: ${vocabsWithImages} / ${totalVocabs} (${((vocabsWithImages / totalVocabs) * 100).toFixed(1)}%)`)

        // 5. 检查图片目录
        console.log('\n检查图片目录:')
        const imageDirs = [
            path.join(process.cwd(), '..', 'public', 'uploads', 'vocabulary-images'),
            path.join(process.cwd(), 'public', 'uploads', 'vocabulary-images'),
        ]

        for (const dir of imageDirs) {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir)
                console.log(`  ✓ ${dir}`)
                console.log(`    文件数: ${files.length}`)
                if (files.length > 0) {
                    console.log(`    示例: ${files.slice(0, 3).join(', ')}`)
                }
            } else {
                console.log(`  ✗ ${dir} (不存在)`)
            }
        }

        // 6. 诊断结论
        console.log('\n=========================================')
        console.log('  诊断结论')
        console.log('=========================================')

        const issues: string[] = []

        if (totalAudios === 0) {
            issues.push('⚠️  数据库中没有音频记录')
        }

        if (totalImages === 0) {
            issues.push('⚠️  数据库中没有图片记录')
        }

        if (totalAudios > 0 && vocabsWithAudios < totalVocabs * 0.5) {
            issues.push('⚠️  音频覆盖率低于50%')
        }

        if (totalImages > 0 && vocabsWithImages < totalVocabs * 0.5) {
            issues.push('⚠️  图片覆盖率低于50%')
        }

        if (issues.length > 0) {
            console.log('\n发现的问题:')
            issues.forEach(issue => console.log(`  ${issue}`))
            console.log('\n建议:')
            if (totalAudios === 0 || totalImages === 0) {
                console.log('  1. 运行导入脚本补充音频和图片数据')
                console.log('  2. 确保图片文件已上传到服务器')
            }
        } else {
            console.log('\n✓ 未发现明显问题')
        }

        console.log('=========================================\n')

    } catch (error) {
        console.error('✗ 诊断失败:', error)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    diagnose()
}

export { diagnose }
