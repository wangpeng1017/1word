import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// IPA 扩展字符转换为标准音标
function normalizePhonetic(phonetic: string | null): string {
    if (!phonetic) return ''

    // 只取第一个音标（如果有多个用 /, 分隔）
    let normalized = phonetic.split('/,')[0].trim()
    normalized = normalized.split(',')[0].trim()

    // 移除开头和结尾的 /
    normalized = normalized.replace(/^\/+|\/+$/g, '')

    // IPA 扩展字符替换
    const replacements: [string | RegExp, string][] = [
        ['ɹ', 'r'],      // 卷舌 r
        ['ɫ', 'l'],      // 软化 l
        ['ɑ', 'ɑ'],      // 保持
        ['ɔ', 'ɔ'],      // 保持
        ['ə', 'ə'],      // 保持
        ['ʃ', 'ʃ'],      // 保持
        ['ʒ', 'ʒ'],      // 保持
        ['θ', 'θ'],      // 保持
        ['ð', 'ð'],      // 保持
        ['ŋ', 'ŋ'],      // 保持
        ['æ', 'æ'],      // 保持
        ['ɪ', 'ɪ'],      // 保持
        ['ʊ', 'ʊ'],      // 保持
        ['ʌ', 'ʌ'],      // 保持
        ['ɛ', 'e'],      // ɛ → e
        ['ˌ', 'ˌ'],      // 次重音
        ['ˈ', 'ˈ'],      // 主重音
    ]

    for (const [from, to] of replacements) {
        normalized = normalized.replace(new RegExp(from, 'g'), to)
    }

    // 添加方括号
    if (normalized && !normalized.startsWith('[') && !normalized.startsWith('/')) {
        normalized = `/${normalized}/`
    }

    return normalized
}

async function fixPhonetics() {
    console.log('=========================================')
    console.log('  修复音标数据')
    console.log('=========================================\n')

    // 获取所有有音标的词汇
    const vocabs = await prisma.vocabularies.findMany({
        where: {
            OR: [
                { phonetic: { not: null } },
                { phonetic_us: { not: null } },
                { phonetic_uk: { not: null } }
            ]
        }
    })

    console.log(`需要处理的词汇: ${vocabs.length} 个\n`)

    let updateCount = 0

    for (const vocab of vocabs) {
        const newPhonetic = normalizePhonetic(vocab.phonetic)
        const newPhoneticUS = normalizePhonetic(vocab.phonetic_us)
        const newPhoneticUK = normalizePhonetic(vocab.phonetic_uk)

        // 检查是否需要更新
        const needsUpdate =
            newPhonetic !== vocab.phonetic ||
            newPhoneticUS !== vocab.phonetic_us ||
            newPhoneticUK !== vocab.phonetic_uk

        if (needsUpdate) {
            await prisma.vocabularies.update({
                where: { id: vocab.id },
                data: {
                    phonetic: newPhonetic || null,
                    phonetic_us: newPhoneticUS || null,
                    phonetic_uk: newPhoneticUK || null
                }
            })
            updateCount++

            if (updateCount <= 10) {
                console.log(`${vocab.word}: ${vocab.phonetic_us} -> ${newPhoneticUS}`)
            }
        }
    }

    console.log(`\n更新了 ${updateCount} 条记录`)

    // 显示修复后的示例
    console.log('\n=== 修复后的示例 ===')
    const samples = await prisma.vocabularies.findMany({
        where: { word: { in: ['racial', 'rational', 'radar', 'racism'] } },
        select: { word: true, phonetic_us: true, phonetic_uk: true }
    })

    for (const v of samples) {
        console.log(`${v.word}: US=${v.phonetic_us}, UK=${v.phonetic_uk}`)
    }

    await prisma.$disconnect()
}

fixPhonetics()
