import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkQuestions() {
    const qCount = await prisma.questions.count()
    const oCount = await prisma.question_options.count()

    console.log('题目数:', qCount)
    console.log('选项数:', oCount)

    // 按题型统计
    const byType = await prisma.questions.groupBy({
        by: ['type'],
        _count: true
    })

    console.log('\n按题型统计:')
    byType.forEach(t => console.log(`  ${t.type}: ${t._count}`))

    await prisma.$disconnect()
}

checkQuestions()
