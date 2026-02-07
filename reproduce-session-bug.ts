
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function reproduce() {
    const studentId = 'test_student_' + Date.now()
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'

    console.log('1. Creating initial session with 10 words (simulate New Words)')
    const session1 = await prisma.study_records.create({
        data: {
            id: 'sr_' + Date.now(),
            studentId,
            taskDate: today,
            totalWords: 10,
            completedWords: 0,
            correctCount: 0,
            wrongCount: 0,
            accuracy: 0,
            totalTime: 0,
            startedAt: new Date(),
            status: 'IN_PROGRESS',
            updatedAt: new Date()
        }
    })
    console.log('Session Created:', session1.id, 'Total:', session1.totalWords)

    console.log('2. Simulating "Review Mode" request with 1905 words')
    // Simulating the logic in POST /api/study-sessions
    const existingSession = await prisma.study_records.findFirst({
        where: {
            studentId,
            taskDate: today,
            isRetestMode: false,
        },
        orderBy: { createdAt: 'desc' },
    })

    if (existingSession) {
        console.log('Existing session found:', existingSession.id)
        if (existingSession.totalWords < 1905) {
            console.log('BUG DETECTED: Existing totalWords is', existingSession.totalWords, 'but request is 1905. Backend fails to update.')
        } else {
            console.log('Logic looks correct.')
        }
    }
}

reproduce()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
