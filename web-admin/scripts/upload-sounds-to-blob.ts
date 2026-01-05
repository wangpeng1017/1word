/**
 * @file upload-sounds-to-blob.ts
 * @desc 将音效文件上传到 Vercel Blob 存储
 * 
 * 使用方法:
 * 1. 将音效文件放入 wechat-miniapp/sounds/ 目录
 * 2. 确保 .env.local 中有 BLOB_READ_WRITE_TOKEN
 * 3. 运行: npx tsx scripts/upload-sounds-to-blob.ts
 */

import { put, list } from '@vercel/blob'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

// 音效文件目录（相对于项目根目录）
const SOUNDS_DIR = path.join(__dirname, '../../wechat-miniapp/sounds')

// 支持的音频格式
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg']

interface UploadResult {
    fileName: string
    url: string
    success: boolean
    error?: string
}

async function uploadSoundsToBlob(): Promise<void> {
    console.log('🔊 音效文件上传工具')
    console.log('='.repeat(50))

    // 检查环境变量
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('✗ 错误: 未找到 BLOB_READ_WRITE_TOKEN 环境变量')
        console.log('\n请在 .env.local 中设置:')
        console.log('BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx...')
        process.exit(1)
    }

    // 检查目录是否存在
    if (!fs.existsSync(SOUNDS_DIR)) {
        console.error(`✗ 错误: 音效目录不存在: ${SOUNDS_DIR}`)
        console.log('\n请先创建目录并放入音效文件:')
        console.log('  - correct.mp3   (答对音效)')
        console.log('  - wrong.mp3     (答错音效)')
        console.log('  - streak_5.mp3  (连对5题)')
        console.log('  - streak_10.mp3 (连对10题)')
        console.log('  - complete.mp3  (完成学习)')
        process.exit(1)
    }

    // 获取所有音频文件
    const files = fs.readdirSync(SOUNDS_DIR)
        .filter(file => AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase()))
        .filter(file => !file.startsWith('.'))  // 排除隐藏文件

    if (files.length === 0) {
        console.log('⚠️ 未找到音效文件')
        console.log(`请将 .mp3 文件放入: ${SOUNDS_DIR}`)
        return
    }

    console.log(`\n找到 ${files.length} 个音效文件:`)
    files.forEach(f => console.log(`  - ${f}`))

    // 上传文件
    const results: UploadResult[] = []
    console.log('\n开始上传...\n')

    for (const fileName of files) {
        const filePath = path.join(SOUNDS_DIR, fileName)
        const fileBuffer = fs.readFileSync(filePath)
        const blobPath = `sounds/${fileName}`

        try {
            const blob = await put(blobPath, fileBuffer, {
                access: 'public',
                contentType: getContentType(fileName)
            })

            results.push({
                fileName,
                url: blob.url,
                success: true
            })

            console.log(`✓ ${fileName}`)
            console.log(`  URL: ${blob.url}`)
        } catch (error: any) {
            results.push({
                fileName,
                url: '',
                success: false,
                error: error.message
            })
            console.log(`✗ ${fileName}: ${error.message}`)
        }
    }

    // 输出结果汇总
    console.log('\n' + '='.repeat(50))
    console.log('上传完成!')
    console.log(`成功: ${results.filter(r => r.success).length}`)
    console.log(`失败: ${results.filter(r => !r.success).length}`)

    // 生成配置代码
    const successResults = results.filter(r => r.success)
    if (successResults.length > 0) {
        console.log('\n📋 请将以下配置更新到 utils/audio.js 中的 SOUND_URLS:\n')
        console.log('const SOUND_URLS = {')
        successResults.forEach(r => {
            const key = path.basename(r.fileName, path.extname(r.fileName))
            console.log(`  ${key}: '${r.url}',`)
        })
        console.log('}')
    }
}

function getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase()
    const types: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg'
    }
    return types[ext] || 'audio/mpeg'
}

// 运行
uploadSoundsToBlob().catch(console.error)
