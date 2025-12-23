const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 艾宾浩斯复习间隔：学习后第N天需要复习（绝对天数模式）
const REVIEW_DAYS_FROM_LEARNING = [1, 2, 4, 7, 15]

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
  console.log(`\n${'='.repeat(70)}`)
  console.log(`学生账号: ${studentNo}`)
  console.log('='.repeat(70))

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
  const days = 25

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
  console.log(`复习间隔(艾宾浩斯): 第${REVIEW_DAYS_FROM_LEARNING.join('、')}天`)

  // 建立每日计划词汇数Map
  const dailyPlanWords = new Map()

  if (planClass?.vocabulary_packs) {
    const pack = planClass.vocabulary_packs
    const planStartDate = toBeijingDate(planClass.start_date)

    console.log(`词汇库: ${pack.name}`)
    console.log(`总天数: ${pack.totalDays}`)
    console.log(`计划开始日期: ${formatDateBeijing(planStartDate)}`)

    // 遍历词汇库的每一天
    for (const packDay of pack.pack_days) {
      const planDate = new Date(planStartDate.getTime() + (packDay.dayNumber - 1) * 24 * 60 * 60 * 1000)
      const planDateStr = formatDateBeijing(planDate)

      const wordsCount = packDay.day_words.filter(dw => {
        const vocab = dw.vocabulary
        return vocab &&
          !masteredVocabIds.has(vocab.id) &&
          vocab.questions &&
          vocab.questions.length > 0
      }).length

      dailyPlanWords.set(planDateStr, wordsCount)
    }
  } else {
    console.log('没有活跃的词汇库计划')
  }

  // 计算预测
  console.log('\n' + '-'.repeat(70))
  console.log('未来25天学习预测 (绝对天数模式):')
  console.log('-'.repeat(70))
  console.log('日期\t\t\t新学\t复习\t总计\t复习来源')
  console.log('-'.repeat(70))

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
    const targetDateStr = formatDateBeijing(targetDate)

    // 计算复习量（基于绝对天数模式）
    let reviewWordsCount = 0
    const reviewSources = []

    for (const reviewDay of REVIEW_DAYS_FROM_LEARNING) {
      const learnDate = new Date(targetDate.getTime() - reviewDay * 24 * 60 * 60 * 1000)
      const learnDateStr = formatDateBeijing(learnDate)

      const wordsPlanedThatDay = dailyPlanWords.get(learnDateStr) || 0

      if (wordsPlanedThatDay > 0) {
        reviewWordsCount += wordsPlanedThatDay
        reviewSources.push(`${learnDateStr.slice(5)}(${wordsPlanedThatDay}词,第${reviewDay}天)`)
      }
    }

    // 获取当天的新学单词数
    const newWordsCount = dailyPlanWords.get(targetDateStr) || 0
    const totalCount = reviewWordsCount + newWordsCount

    const dayLabel = i === 0 ? '(今天)' : i === 1 ? '(明天)' : ''
    const sourcesStr = reviewSources.length > 0 ? reviewSources.join(', ') : '-'

    console.log(`${targetDateStr} ${dayLabel}\t${newWordsCount}\t${reviewWordsCount}\t${totalCount}\t${sourcesStr}`)
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
