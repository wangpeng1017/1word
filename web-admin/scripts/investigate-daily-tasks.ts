
import { PrismaClient } from '@prisma/client'
import { startOfDay, endOfDay } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    const keyword = process.argv[2]
    if (!keyword) {
        console.error('Please provide a student ID, phone number, or name.')
        process.exit(1)
    }

    console.log(`Searching for student with keyword: "${keyword}"...`)

    const student = await prisma.students.findFirst({
        where: {
            OR: [
                { id: keyword },
                { phone: keyword },
                { name: { contains: keyword } },
                { student_no: keyword }
            ]
        },
        include: {
            class: true
        }
    })

    if (!student) {
        console.error('Student not found.')
        process.exit(1)
    }

    console.log(`Found Student: ${student.name} (${student.id}) - Class: ${student.class_id}`)

    // 1. Check Study Records for Today
    const today = new Date()
    const start = startOfDay(today)
    const end = endOfDay(today)

    const records = await prisma.study_records.findMany({
        where: {
            studentId: student.id,
            createdAt: { gte: start, lte: end }
        },
        orderBy: { createdAt: 'desc' }
    })

    console.log('\n--- Today\'s Study Records ---')
    if (records.length === 0) {
        console.log('No study records found for today.')
    } else {
        records.forEach(r => {
            console.log(`[${r.createdAt.toISOString()}] Total: ${r.totalWords}, Completed: ${r.completedWords}, Finished: ${r.isCompleted}`)
        })
    }

    // 2. Check Daily Task Logic
    // Get active plan
    const planClass = await prisma.plan_classes.findFirst({
        where: {
            class_id: student.class_id,
            status: 'ACTIVE'
        },
        include: {
            vocabulary_packs: {
                include: {
                    pack_days: {
                        include: {
                            day_words: {
                                include: {
                                    vocabulary: true
                                }
                            }
                        },
                        orderBy: { dayNumber: 'asc' }
                    }
                }
            }
        }
    })

    if (!planClass || !planClass.vocabulary_packs) {
        console.log('\nNo active plan found.')
        return
    }

    const pack = planClass.vocabulary_packs
    console.log(`\nActive Pack: ${pack.name} (Total Days: ${pack.totalDays})`)

    // Calculate Day Number
    const startDate = new Date(planClass.start_date)
    const diffTime = today.getTime() - startDate.getTime()
    const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    console.log(`Calculated Day Number: ${dayNumber}`)

    // Get words for this day
    const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
    if (!packDay) {
        console.log(`No pack data for day ${dayNumber}`)
        return
    }

    const dayVocabs = packDay.day_words.map(dw => dw.vocabulary)
    console.log(`Total words in Day ${dayNumber} pack: ${dayVocabs.length}`)

    // Check Mastery
    const mastered = await prisma.word_masteries.findMany({
        where: {
            studentId: student.id,
            vocabularyId: { in: dayVocabs.map(v => v.id) },
            isMastered: true
        }
    })
    console.log(`Mastered words from today's pack: ${mastered.length}`)

    // Check Study Plans (In Progress)
    const plans = await prisma.study_plans.findMany({
        where: {
            studentId: student.id,
            vocabularyId: { in: dayVocabs.map(v => v.id) }
        }
    })

    const inProgressMap = new Map()
    plans.forEach(p => {
        if (inProgressMap.has(p.status)) {
            inProgressMap.set(p.status, inProgressMap.get(p.status) + 1)
        } else {
            inProgressMap.set(p.status, 1)
        }
    })

    console.log('\n--- Study Plans Status for Today\'s Words ---')
    console.log(`Total plans found: ${plans.length}`)
    inProgressMap.forEach((count, status) => {
        console.log(`Status '${status}': ${count}`)
    })

    // Simulation of "New Words" logic
    const masteredIds = new Set(mastered.map(m => m.vocabularyId))
    const newWordsCandidate = dayVocabs.filter(v => !masteredIds.has(v.id))
    console.log(`\nWords NOT Mastered (Potential New Words): ${newWordsCandidate.length}`)

    // Check if they are already in study plans
    const planIds = new Set(plans.map(p => p.vocabularyId))
    const reallyNewWords = newWordsCandidate.filter(v => !planIds.has(v.id))
    console.log(`Words NOT in Study Plans (Really New): ${reallyNewWords.length}`)

}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
