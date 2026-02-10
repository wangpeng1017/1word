const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const questions = await prisma.questions.findMany({
        where: {
            vocabularies: { word: 'rude' }
        },
        include: {
            question_options: { orderBy: { order: 'asc' } },
            vocabularies: { select: { word: true, primary_meaning: true } }
        }
    })

    for (const q of questions) {
        console.log('\n=== Question ===')
        console.log('ID:', q.id)
        console.log('Type:', q.type)
        console.log('Content:', q.content)
        console.log('correctAnswer (DB):', q.correctAnswer)
        console.log('Word:', q.vocabularies?.word, '- Meaning:', q.vocabularies?.primary_meaning)
        console.log('Options:')
        const labels = ['A', 'B', 'C', 'D']
        for (let i = 0; i < q.question_options.length; i++) {
            const o = q.question_options[i]
            const label = labels[i] || String(i)
            console.log(`  ${label} (order=${o.order}): ${o.content} | isCorrect=${o.isCorrect}`)
        }

        // Check consistency
        const correctIdx = q.question_options.findIndex(o => o.isCorrect)
        const correctLabel = correctIdx >= 0 ? labels[correctIdx] : 'NONE'
        console.log(`\n>>> DB correctAnswer="${q.correctAnswer}" vs isCorrect option="${correctLabel}"`)
        if (q.correctAnswer !== correctLabel) {
            console.log('!!! MISMATCH DETECTED !!!')
        } else {
            console.log('OK - Consistent')
        }
    }

    await prisma.$disconnect()
}

main()
