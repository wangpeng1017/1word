const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 模拟 API 逻辑
function getTodayBeijing() {
  const now = new Date()
  const beijingOffset = 8 * 60 * 60 * 1000
  return new Date(now.getTime() + beijingOffset)
}

function toBeijingDate(date) {
  const d = new Date(date)
  const beijingOffset = 8 * 60 * 60 * 1000
  return new Date(d.getTime() + beijingOffset)
}

function getDateRangeUTC() {
  const now = new Date()
  const beijingOffset = 8 * 60
  const utcHours = now.getUTCHours()
  const utcMinutes = now.getUTCMinutes()
  const totalMinutes = utcHours * 60 + utcMinutes
  const beijingMinutes = totalMinutes + beijingOffset

  const start = new Date(now)
  if (beijingMinutes >= 24 * 60) {
    start.setUTCHours(24 - 8, 0, 0, 0)
  } else {
    start.setUTCDate(start.getUTCDate() - 1)
    start.setUTCHours(16, 0, 0, 0)
  }

  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  end.setUTCMilliseconds(-1)

  return { start, end }
}

async function test() {
  const studentNo = '20001'
  const student = await prisma.students.findFirst({
    where: { student_no: studentNo },
    include: {
      user: { select: { name: true } },
      classes: { select: { id: true, name: true } },
    }
  })

  const studentId = student.id
  const { start: startOfToday, end: endOfToday } = getDateRangeUTC()

  // 获取学习计划
  const studyPlans = await prisma.study_plans.findMany({ where: { studentId } })
  const learnedVocabIds = new Set(studyPlans.map(p => p.vocabularyId))

  // 获取掌握度
  const wordMasteries = await prisma.word_masteries.findMany({ where: { studentId } })
  const masteredVocabIds = new Set(wordMasteries.filter(m => m.isMastered).map(m => m.vocabularyId))

  // 获取词汇库计划
  const planClass = await prisma.plan_classes.findFirst({
    where: { class_id: student.classes.id, status: 'ACTIVE' },
    include: {
      vocabulary_packs: {
        include: {
          pack_days: {
            include: { day_words: { select: { vocabularyId: true } } }
          }
        }
      }
    }
  })

  const pack = planClass.vocabulary_packs
  const today = getTodayBeijing()
  const startDateBeijing = toBeijingDate(planClass.start_date)
  const diffTime = today.getTime() - startDateBeijing.getTime()
  const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

  const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
  const dayVocabIds = packDay.day_words.map(dw => dw.vocabularyId)

  // 检查有题目的词汇
  const vocabsWithQuestions = await prisma.vocabularies.findMany({
    where: { id: { in: dayVocabIds }, questions: { some: {} } },
    select: { id: true }
  })
  const vocabIdsWithQuestions = new Set(vocabsWithQuestions.map(v => v.id))

  // 新逻辑：不排除已学习的
  const todayTotalTasks = dayVocabIds.filter(id => {
    return !masteredVocabIds.has(id) && vocabIdsWithQuestions.has(id)
  }).length

  // 获取今日记录
  const todayRecord = await prisma.study_records.findFirst({
    where: { studentId, taskDate: { gte: startOfToday, lte: endOfToday } }
  })

  const todayDueCount = todayRecord?.totalWords || todayTotalTasks
  const todayCompletedCount = todayRecord?.completedWords || 0

  console.log('=== 修复后的结果 ===')
  console.log('学生:', student.user.name)
  console.log('今日配置词汇数:', dayVocabIds.length)
  console.log('有题目的词汇数:', vocabsWithQuestions.length)
  console.log('已掌握:', dayVocabIds.filter(id => masteredVocabIds.has(id)).length)
  console.log('已学习:', dayVocabIds.filter(id => learnedVocabIds.has(id)).length)
  console.log('')
  console.log('todayTotalTasks (新逻辑):', todayTotalTasks)
  console.log('todayRecord.totalWords:', todayRecord?.totalWords)
  console.log('')
  console.log('最终 dueCount:', todayDueCount)
  console.log('最终 completedCount:', todayCompletedCount)
  console.log('')
  console.log('小程序显示:')
  console.log('  今日应复习:', todayDueCount)
  console.log('  已复习:', todayCompletedCount)
}

test().catch(console.error).finally(() => prisma.$disconnect())
