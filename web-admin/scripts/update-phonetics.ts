/**
 * 下载并更新IPA音标数据
 * 使用 ipa-dict 开源项目的数据
 */

import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import * as fs from 'fs-extra'
import * as path from 'path'

const prisma = new PrismaClient()

// ipa-dict GitHub 项目的数据URL
const IPA_DICT_URLS = {
    US: 'https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_US.txt',
    UK: 'https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_UK.txt'
}

interface PhoneticData {
    [word: string]: {
        us?: string
        uk?: string
    }
}

async function downloadIPAData(url: string): Promise<Map<string, string>> {
    try {
        console.log(`下载: ${url}`)
        const response = await axios.get(url, { timeout: 30000 })

        const data = new Map<string, string>()
        const lines = response.data.split('\n')

        for (const line of lines) {
            if (!line.trim()) continue

            // 格式: word /ipa/
            const match = line.match(/^([^\s]+)\s+\/(.+)\/$/)
            if (match) {
                const word = match[1].toLowerCase()
                const ipa = match[2]
                data.set(word, ipa)
            }
        }

        console.log(`  ✓ 解析了 ${data.size} 个单词的音标\n`)
        return data

    } catch (error) {
        console.error(`下载失败:`, error instanceof Error ? error.message : error)
        return new Map()
    }
}

async function updatePhonetics() {
    try {
        console.log('=========================================')
        console.log('  更新IPA音标数据')
        console.log('=========================================\n')

        // 下载美式和英式音标数据
        console.log('1. 下载音标数据...\n')
        const [usData, ukData] = await Promise.all([
            downloadIPAData(IPA_DICT_URLS.US),
            downloadIPAData(IPA_DICT_URLS.UK)
        ])

        // 合并数据
        const phoneticData: PhoneticData = {}

        for (const [word, ipa] of usData) {
            if (!phoneticData[word]) phoneticData[word] = {}
            phoneticData[word].us = ipa
        }

        for (const [word, ipa] of ukData) {
            if (!phoneticData[word]) phoneticData[word] = {}
            phoneticData[word].uk = ipa
        }

        console.log(`合并后共 ${Object.keys(phoneticData).length} 个单词有音标数据\n`)

        // 获取所有词汇
        console.log('2. 查询数据库词汇...\n')
        const vocabularies = await prisma.vocabularies.findMany()
        console.log(`  ✓ 找到 ${vocabularies.length} 个词汇\n`)

        // 更新音标
        console.log('3. 更新音标...\n')
        let updatedCount = 0
        let notFoundCount = 0

        for (const vocab of vocabularies) {
            const word = vocab.word.toLowerCase()
            const phonetic = phoneticData[word]

            if (phonetic) {
                await prisma.vocabularies.update({
                    where: { id: vocab.id },
                    data: {
                        phonetic_us: phonetic.us || null,
                        phonetic_uk: phonetic.uk || null,
                        phonetic: phonetic.us || phonetic.uk || null
                    }
                })
                updatedCount++

                if (updatedCount % 100 === 0) {
                    console.log(`  进度: ${updatedCount}/${vocabularies.length}`)
                }
            } else {
                notFoundCount++
            }
        }

        console.log('\n=========================================')
        console.log('✓ 更新完成!')
        console.log(`  总计: ${vocabularies.length}`)
        console.log(`  已更新: ${updatedCount}`)
        console.log(`  未找到: ${notFoundCount}`)
        console.log('=========================================')

        // 保存未找到音标的单词列表
        if (notFoundCount > 0) {
            const missingWords: string[] = []
            for (const vocab of vocabularies) {
                const word = vocab.word.toLowerCase()
                if (!phoneticData[word]) {
                    missingWords.push(vocab.word)
                }
            }

            const missingFile = path.join(process.cwd(), '..', 'missing-phonetics.json')
            await fs.writeJSON(missingFile, {
                generatedAt: new Date().toISOString(),
                count: notFoundCount,
                words: missingWords
            }, { spaces: 2 })

            console.log(`\n⚠ 未找到音标的单词列表已保存到: ${missingFile}`)
        }

    } catch (error) {
        console.error('\n✗ 执行失败:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

if (require.main === module) {
    updatePhonetics()
}
