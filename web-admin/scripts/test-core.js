const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testFullFlow() {
  console.log('=== 核心功能测试 ===\n')

  const studentId = 'student_1765845936979_kx1bb7q7'
  const student = await prisma.students.findUnique({
    where: { id: studentId },
    include: { classes: true, user: true }
  })
  console.log('1. 学生:', student.user?.name, '班级:', student.classes?.name)

  const planClass = await prisma.plan_classes.findFirst({
    where: { class_id: student.class_id, status: 'ACTIVE' },
    include: { vocabulary_packs: true }
  })
  console.log('2. 活跃计划:', planClass ? planClass.vocabulary_packs.name : '无')

  const wordMasteries = await prisma.word_masteries.findMany({ where: { studentId } })
  const studyPlans = await prisma.study_plans.findMany({ where: { studentId } })

  const masteredIds = new Set(wordMasteries.filter(m => m.isMastered).map(m => m.vocabularyId))
  const learnedIds = new Set(studyPlans.map(p => p.vocabularyId))

  const pack = await prisma.vocabulary_packs.findUnique({
    where: { id: planClass.pack_id },
    include: {
      pack_days: {
        where: { dayNumber: 1 },
        include: { day_words: { select: { vocabularyId: true } } }
      }
    }
  })

  const dayVocabIds = pack.pack_days[0]?.day_words.map(dw => dw.vocabularyId) || []
  const vocabsWithQuestions = await prisma.vocabularies.findMany({
    where: { id: { in: dayVocabIds }, questions: { some: {} } },
    select: { id: true }
  })
  const vocabIdsWithQuestions = new Set(vocabsWithQuestions.map(v => v.id))

  const newCount = dayVocabIds.filter(id => {
    return !masteredIds.has(id) && !learnedIds.has(id) && vocabIdsWithQuestions.has(id)
  }).length

  console.log('3. 今日新词数:', newCount)
  console.log('4. miniapp.today.dueCount:', newCount)
  console.log('\n=== 测试完成 ===')
  console.log('结论: 学生 10008 应显示', newCount, '个任务')
}

testFullFlow().catch(console.error).finally(() => prisma.$disconnect())
