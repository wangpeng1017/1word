const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 获取北京时间今天的开始
function getTodayBeijing() {
  const now = new Date()
  const beijingOffset = 8 * 60 * 60 * 1000
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const beijingTime = new Date(utcTime + beijingOffset)
  beijingTime.setHours(0, 0, 0, 0)
  return beijingTime
}

// 格式化日期为北京时间字符串
function formatDateBeijing(date) {
  const beijingOffset = 8 * 60 * 60 * 1000
  const utcTime = date.getTime() + date.getTimezoneOffset() * 60 * 1000
  const beijingTime = new Date(utcTime + beijingOffset)
  return beijingTime.toISOString().split('T')[0]
}

// 转换为北京时间
function toBeijingDate(date) {
  const d = new Date(date)
  const beijingOffset = 8 * 60 * 60 * 1000
  const utcTime = d.getTime() + d.getTimezoneOffset() * 60 * 1000
  return new Date(utcTime + beijingOffset)
}

async function checkForecast(studentNo) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`学生账号: ${studentNo}`)
  console.log('='.repeat(60))

  // 查找学生
  const student = await prisma.students.findFirst({
    where: { student_no: studentNo },
    select: { id: true, class_id: true, user: { select: { name: true } } }
  })

  if (!student) {
    console.log('学生不存在')
    return
  }

  console.log(`学生姓名: ${student.user?.name || '未知'}`)
  console.log(`学生ID: ${student.id}`)

  const studentId = student.id
  const days = 7

  // 获取所有未掌握的学习计划（用于计算复习量）
  const plans = await prisma.study_plans.findMany({
    where: {
      studentId,
      status: { not: 'MASTERED' },
    },
    select: {
      id: true,
      vocabularyId: true,
      nextReviewAt: true,
      reviewCount: true,
      status: true,
    },
  })

  console.log(`\n复习池中单词数: ${plans.length}`)

  // 获取已学过的词汇ID
  const learnedVocabIds = new Set(
    (await prisma.study_plans.findMany({
      where: { studentId },
      select: { vocabularyId: true },
    })).map(p => p.vocabularyId)
  )

  console.log(`已学过单词数: ${learnedVocabIds.size}`)

  // 获取已掌握的词汇ID
  const masteredVocabIds = new Set(
    (await prisma.word_masteries.findMany({
      where: { studentId, isMastered: true },
      select: { vocabularyId: true },
    })).map(w => w.vocabularyId)
  )

  console.log(`已掌握单词数: ${masteredVocabIds.size}`)

  // 获取班级的活跃词汇库计划
  const planClass = await prisma.plan_classes.findFirst({
    where: {
      class_id: student.class_id,
      status: 'ACTIVE',
    },
    include: {
      vocabulary_packs: {
        include: {
          pack_days: {
            include: {
              day_words: {
                include: {
                  vocabulary: {
                    select: {
                      id: true,
                      word: true,
                      questions: { select: { id: true } },
                    },
                  },
                },
              },
            },
            orderBy: { dayNumber: 'asc' },
          },
        },
      },
    },
  })

  const today = getTodayBeijing()
  console.log(`\n今天日期(北京时间): ${formatDateBeijing(today)}`)

  // 计算词汇库计划信息
  let planStartDayNumber = 0
  let totalDays = 0
  const dailyNewWordsMap = new Map()

  if (planClass?.vocabulary_packs) {
    const pack = planClass.vocabulary_packs
    totalDays = pack.totalDays
    console.log(`词汇库: ${pack.name}`)
    console.log(`总天数: ${totalDays}`)
    console.log(`计划开始日期: ${planClass.start_date}`)

    const startDateBeijing = toBeijingDate(planClass.start_date)
    const diffTime = today.getTime() - startDateBeijing.getTime()
    planStartDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    console.log(`今天是第 ${planStartDayNumber} 天`)

    // 计算未来每天的新学单词数量
    for (let i = 0; i < days; i++) {
      const targetDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
      const targetDateStr = formatDateBeijing(targetDate)
      const dayNumber = planStartDayNumber + i

      if (dayNumber >= 1 && dayNumber <= totalDays) {
        const packDay = pack.pack_days.find(d => d.dayNumber === dayNumber)
        if (packDay) {
          const newWords = packDay.day_words.filter(dw => {
            const vocab = dw.vocabulary
            return vocab &&
              !learnedVocabIds.has(vocab.id) &&
              !masteredVocabIds.has(vocab.id) &&
              vocab.questions &&
              vocab.questions.length > 0
          })

          dailyNewWordsMap.set(targetDateStr, {
            count: newWords.length,
            words: newWords.map(dw => dw.vocabulary?.word).filter(Boolean)
          })
        }
      }
    }
  } else {
    console.log('没有活跃的词汇库计划')
  }

  // 计算预测
  console.log('\n' + '-'.repeat(60))
  console.log('未来7天学习预测:')
  console.log('-'.repeat(60))
  console.log('日期\t\t\t新学\t复习\t总计')
  console.log('-'.repeat(60))

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
    const targetDateStr = formatDateBeijing(targetDate)

    // 统计复习数量
    let reviewWordsCount = 0
    for (const plan of plans) {
      if (plan.nextReviewAt && new Date(plan.nextReviewAt) <= targetDate) {
        reviewWordsCount++
      }
    }

    // 获取新学单词数
    const newWordsInfo = dailyNewWordsMap.get(targetDateStr) || { count: 0, words: [] }
    const newWordsCount = newWordsInfo.count
    const totalCount = reviewWordsCount + newWordsCount

    const dayLabel = i === 0 ? '(今天)' : i === 1 ? '(明天)' : ''
    console.log(`${targetDateStr} ${dayLabel}\t${newWordsCount}\t${reviewWordsCount}\t${totalCount}`)
  }

  // 显示明天的详细信息
  const tomorrowDate = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)
  const tomorrowDateStr = formatDateBeijing(tomorrowDate)
  const tomorrowNewWords = dailyNewWordsMap.get(tomorrowDateStr)

  if (tomorrowNewWords && tomorrowNewWords.words.length > 0) {
    console.log(`\n明天的新学单词 (${tomorrowNewWords.count}个):`)
    console.log(tomorrowNewWords.words.join(', '))
  }

  // 显示明天需要复习的单词
  const tomorrowReviewPlans = plans.filter(p => {
    if (!p.nextReviewAt) return false
    const reviewDate = new Date(p.nextReviewAt)
    return reviewDate <= tomorrowDate
  })

  if (tomorrowReviewPlans.length > 0) {
    const reviewVocabIds = tomorrowReviewPlans.map(p => p.vocabularyId)
    const reviewVocabs = await prisma.vocabularies.findMany({
      where: { id: { in: reviewVocabIds } },
      select: { word: true }
    })
    console.log(`\n明天需要复习的单词 (${reviewVocabs.length}个):`)
    console.log(reviewVocabs.map(v => v.word).join(', '))
  }
}

async function main() {
  try {
    await checkForecast('20005')
    await checkForecast('20010')
  } catch (error) {
    console.error('错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
