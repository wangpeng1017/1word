import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPhonetics() {
    const vocabs = await prisma.vocabularies.findMany({
        where: { word: { in: ['racial', 'rational', 'radar', 'racism', 'radiation'] } },
        select: { word: true, phonetic_us: true, phonetic_uk: true, phonetic: true }
    })

    console.log('检查音标数据:\n')
    for (const v of vocabs) {
        console.log(`${v.word}:`)
        console.log(`  phonetic: ${v.phonetic}`)
        console.log(`  phonetic_us: ${v.phonetic_us}`)
        console.log(`  phonetic_uk: ${v.phonetic_uk}`)
        console.log()
    }

    await prisma.$disconnect()
}

checkPhonetics()
