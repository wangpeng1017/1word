const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 获取北京时间今天的日期
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

async function diagnose(studentNo) {
  console.log('=== 今日复习数据诊断 ===\n')
  console.log('当前时间:', new Date().toISOString())
  console.log('北京时间:', getTodayBeijing().toISOString())

  const { start: startOfToday, end: endOfToday } = getDateRangeUTC()
  console.log('今日范围 (UTC):', startOfToday.toISOString(), '-', endOfToday.toISOString())
  console.log('')

  // 1. 查找学生
  const student = await prisma.students.findFirst({
    where: studentNo ? { student_no: studentNo } : {},
    include: {
      user: { select: { name: true } },
      classes: { select: { id: true, name: true, grade: true } },
    },
    orderBy: { created_at: 'desc' }
  })

  if (!student) {
    console.log('❌ 未找到学生')
    return
  }

  console.log('1. 学生信息:')
  console.log('   - ID:', student.id)
  console.log('   - 姓名:', student.user?.name)
  console.log('   - 学号:', student.student_no)
  console.log('   - 班级:', student.classes?.name || '未分配')
  console.log('')

  // 2. 检查班级的词汇库计划
  if (!student.classes?.id) {
    console.log('❌ 学生未分配班级，无法获取词汇库计划')
    return
  }

  const planClass = await prisma.plan_classes.findFirst({
    where: {
      class_id: student.classes.id,
      status: 'ACTIVE'
    },
    include: {
      vocabulary_packs: {
        include: {
          pack_days: {
            include: {
              day_words: { select: { vocabularyId: true } }
            }
          }
        }
      }
    }
  })

  console.log('2. 词汇库计划:')
  if (!planClass) {
    console.log('   ❌ 班级没有活跃的词汇库计划')
    return
  }

  console.log('   - 计划ID:', planClass.id)
  console.log('   - 词汇库:', planClass.vocabulary_packs?.name)
  console.log('   - 开始日期:', planClass.start_date)
  console.log('   - 状态:', planClass.status)
  console.log('')

  // 3. 计算今天是第几天
  const pack = planClass.vocabulary_packs
  const today = getTodayBeijing()
  const startDateBeijing = toBeijingDate(planClass.start_date)
  const diffTime = today.getTime() - startDateBeijing.getTime()
  const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

  console.log('3. 天数计算:')
  console.log('   - 计划开始日期 (北京):', startDateBeijing.toISOString().split('T')[0])
  console.log('   - 今天 (北京):', today.toISOString().split('T')[0])
  console.log('   - 今天是第', dayNumber, '天')
  console.log('   - 词汇库总天数:', pack.totalDays)
  console.log('')

  if (dayNumber < 1 || dayNumber > pack.totalDays) {
    console.log('   ❌ 今天不在计划范围内')
    return
  }

  // 4. 获取今天的词汇
  const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
  if (!packDay) {
    console.log('   ❌ 未找到第', dayNumber, '天的配置')
    return
  }

  const dayVocabIds = packDay.day_words.map(dw => dw.vocabularyId)
  console.log('4. 今日词汇配置:')
  console.log('   - Day', dayNumber, '配置词汇数:', dayVocabIds.length)
  console.log('')

  // 5. 检查词汇是否有题目
  const vocabsWithQuestions = await prisma.vocabularies.findMany({
    where: {
      id: { in: dayVocabIds },
      questions: { some: {} }
    },
    select: { id: true, word: true }
  })
  const vocabIdsWithQuestions = new Set(vocabsWithQuestions.map(v => v.id))

  console.log('5. 题目检查:')
  console.log('   - 配置词汇数:', dayVocabIds.length)
  console.log('   - 有题目的词汇数:', vocabsWithQuestions.length)
  console.log('   - 无题目的词汇数:', dayVocabIds.length - vocabsWithQuestions.length)
  if (vocabsWithQuestions.length < 5) {
    console.log('   - 有题目的词汇:', vocabsWithQuestions.map(v => v.word).join(', '))
  }
  console.log('')

  // 6. 检查学生的学习状态
  const studentId = student.id
  const wordMasteries = await prisma.word_masteries.findMany({
    where: { studentId }
  })
  const studyPlans = await prisma.study_plans.findMany({
    where: { studentId }
  })

  const masteredIds = new Set(wordMasteries.filter(m => m.isMastered).map(m => m.vocabularyId))
  const learnedIds = new Set(studyPlans.map(p => p.vocabularyId))

  console.log('6. 学生学习状态:')
  console.log('   - 总掌握词汇数:', masteredIds.size)
  console.log('   - 总学习计划数:', learnedIds.size)
  console.log('')

  // 7. 计算今日新词数
  const newWords = dayVocabIds.filter(id =>
    !masteredIds.has(id) &&
    !learnedIds.has(id) &&
    vocabIdsWithQuestions.has(id)
  )

  console.log('7. 今日新词计算:')
  console.log('   - 配置词汇:', dayVocabIds.length)
  console.log('   - 已掌握:', dayVocabIds.filter(id => masteredIds.has(id)).length)
  console.log('   - 已学习:', dayVocabIds.filter(id => learnedIds.has(id)).length)
  console.log('   - 无题目:', dayVocabIds.filter(id => !vocabIdsWithQuestions.has(id)).length)
  console.log('   - 今日新词数:', newWords.length)
  console.log('')

  // 8. 计算需要复习的词汇
  const needReview = await prisma.study_plans.count({
    where: {
      studentId,
      status: 'LEARNING',
      nextReviewAt: { lte: endOfToday },
    },
  })

  console.log('8. 复习词汇:')
  console.log('   - 需要复习数:', needReview)
  console.log('')

  // 9. 今日学习记录
  const todayRecord = await prisma.study_records.findFirst({
    where: {
      studentId,
      taskDate: { gte: startOfToday, lte: endOfToday }
    }
  })

  console.log('9. 今日学习记录:')
  if (todayRecord) {
    console.log('   - 记录ID:', todayRecord.id)
    console.log('   - 完成词数:', todayRecord.completedWords)
    console.log('   - 总词数:', todayRecord.totalWords)
    console.log('   - 用时:', todayRecord.totalTime, '秒')
  } else {
    console.log('   - 无今日记录')
  }
  console.log('')

  // 10. 最终结果
  const todayDueCount = newWords.length + needReview
  const todayCompletedCount = todayRecord?.completedWords || 0

  console.log('=== 最终结果 ===')
  console.log('今日应复习 (dueCount):', todayDueCount)
  console.log('  - 新词:', newWords.length)
  console.log('  - 复习:', needReview)
  console.log('已复习 (completedCount):', todayCompletedCount)
  console.log('')

  if (todayDueCount === 0) {
    console.log('⚠️ 问题诊断:')
    if (dayVocabIds.length === 0) {
      console.log('   - Day', dayNumber, '没有配置词汇')
    }
    if (vocabsWithQuestions.length === 0) {
      console.log('   - 配置的词汇都没有题目')
    }
    if (newWords.length === 0 && dayVocabIds.length > 0) {
      console.log('   - 所有词汇都已学习或掌握')
    }
    if (needReview === 0) {
      console.log('   - 没有需要复习的词汇')
    }
  }
}

const studentNo = process.argv[2]
diagnose(studentNo)
  .catch(console.error)
  .finally(() => prisma.$disconnect())
