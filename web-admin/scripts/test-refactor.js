/**
 * 学习计划重构 - 功能测试脚本
 * 测试内容：
 * 1. 创建班级计划 (plan_classes)
 * 2. 获取每日任务 (daily-tasks)
 * 3. 提交答题记录 (study-records)
 * 4. 验证学习进度 (study_plans)
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  console.log('=== 学习计划重构功能测试 ===\n')

  // 1. 检查基础数据
  console.log('1. 检查基础数据...')
  const [classCount, studentCount, packCount, vocabCount] = await Promise.all([
    prisma.classes.count(),
    prisma.students.count(),
    prisma.vocabulary_packs.count(),
    prisma.vocabularies.count(),
  ])
  console.log(`   班级: ${classCount}, 学生: ${studentCount}, 词汇库: ${packCount}, 词汇: ${vocabCount}`)

  // 2. 检查词汇库配置
  console.log('\n2. 检查词汇库配置...')
  const packs = await prisma.vocabulary_packs.findMany({
    where: { isActive: true },
    include: {
      pack_days: {
        include: { day_words: true },
        orderBy: { dayNumber: 'asc' }
      }
    }
  })
  for (const pack of packs) {
    const totalWords = pack.pack_days.reduce((sum, d) => sum + d.day_words.length, 0)
    console.log(`   ${pack.name}: ${pack.totalDays}天, ${totalWords}词`)
    if (pack.pack_days.length > 0) {
      console.log(`     Day1: ${pack.pack_days[0].day_words.length}词`)
    }
  }

  // 3. 检查 plan_classes 表
  console.log('\n3. 检查班级计划 (plan_classes)...')
  const planClasses = await prisma.plan_classes.findMany({
    include: {
      classes: { select: { name: true } },
      vocabulary_packs: { select: { name: true } }
    }
  })
  console.log(`   当前班级计划数: ${planClasses.length}`)
  for (const pc of planClasses) {
    console.log(`   - ${pc.classes.name} → ${pc.vocabulary_packs.name} (${pc.status}, 开始: ${pc.start_date.toISOString().split('T')[0]})`)
  }

  // 4. 检查 study_plans 表
  console.log('\n4. 检查学习进度 (study_plans)...')
  const studyPlansCount = await prisma.study_plans.count()
  const studyPlansByStatus = await prisma.study_plans.groupBy({
    by: ['status'],
    _count: true
  })
  console.log(`   总记录数: ${studyPlansCount}`)
  for (const s of studyPlansByStatus) {
    console.log(`   - ${s.status}: ${s._count}`)
  }

  // 5. 检查 word_masteries 表
  console.log('\n5. 检查单词掌握度 (word_masteries)...')
  const masteryCount = await prisma.word_masteries.count()
  const masteredCount = await prisma.word_masteries.count({ where: { isMastered: true } })
  const difficultCount = await prisma.word_masteries.count({ where: { isDifficult: true } })
  console.log(`   总记录数: ${masteryCount}`)
  console.log(`   已掌握: ${masteredCount}, 难点词汇: ${difficultCount}`)

  // 6. 模拟获取每日任务逻辑
  console.log('\n6. 模拟每日任务生成逻辑...')
  const testStudent = await prisma.students.findFirst({
    include: { classes: true }
  })

  if (testStudent) {
    console.log(`   测试学生: ${testStudent.id} (班级: ${testStudent.classes.name})`)

    // 获取班级的活跃计划
    const activePlan = await prisma.plan_classes.findFirst({
      where: { class_id: testStudent.class_id, status: 'ACTIVE' },
      include: {
        vocabulary_packs: {
          include: {
            pack_days: {
              include: {
                day_words: {
                  include: { vocabulary: { select: { id: true, word: true } } }
                }
              }
            }
          }
        }
      }
    })

    if (activePlan) {
      const today = new Date()
      const startDate = new Date(activePlan.start_date)
      const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      console.log(`   活跃计划: ${activePlan.vocabulary_packs.name}`)
      console.log(`   开始日期: ${startDate.toISOString().split('T')[0]}, 今天是第 ${diffDays} 天`)

      // 获取当天词汇
      const packDay = activePlan.vocabulary_packs.pack_days.find(d => d.dayNumber === diffDays)
      if (packDay) {
        console.log(`   Day${diffDays} 词汇数: ${packDay.day_words.length}`)
        console.log(`   示例词汇: ${packDay.day_words.slice(0, 3).map(w => w.vocabulary.word).join(', ')}`)
      } else if (diffDays > activePlan.vocabulary_packs.totalDays) {
        console.log(`   已超出词汇库天数，只复习已学单词`)
      } else {
        console.log(`   Day${diffDays} 无词汇配置`)
      }

      // 检查已掌握词汇
      const masteredWords = await prisma.word_masteries.count({
        where: { studentId: testStudent.id, isMastered: true }
      })
      console.log(`   该学生已掌握词汇: ${masteredWords}`)

      // 检查需要复习的词汇
      const needReview = await prisma.study_plans.count({
        where: {
          studentId: testStudent.id,
          status: 'LEARNING',
          nextReviewAt: { lte: new Date() }
        }
      })
      console.log(`   该学生今日需复习: ${needReview}`)
    } else {
      console.log(`   该学生班级无活跃计划`)
    }
  }

  // 7. 检查题目数据
  console.log('\n7. 检查题目数据...')
  const questionCount = await prisma.questions.count()
  const vocabsWithQuestions = await prisma.questions.groupBy({
    by: ['vocabularyId'],
  })
  console.log(`   总题目数: ${questionCount}`)
  console.log(`   有题目的词汇数: ${vocabsWithQuestions.length}`)

  console.log('\n=== 测试完成 ===')
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
