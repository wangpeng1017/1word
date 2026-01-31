/**
 * @file cleanup-old-data.ts
 * @desc 清理1年前的历史数据，释放磁盘空间
 *
 * 执行方式:
 *   DRY_RUN=true DATABASE_URL="..." npx ts-node scripts/cleanup-old-data.ts
 *
 * 环境变量:
 *   DRY_RUN=true   - 模拟运行，不实际删除（默认）
 *   DRY_RUN=false  - 实际删除数据
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 1年前的日期
const ONE_YEAR_AGO = new Date()
ONE_YEAR_AGO.setFullYear(ONE_YEAR_AGO.getFullYear() - 1)

async function main() {
  const dryRun = process.env.DRY_RUN !== 'false'

  console.log('========================================')
  console.log('   数据清理脚本 - 1年数据保留策略')
  console.log('========================================')
  console.log(`模式: ${dryRun ? 'DRY_RUN (模拟)' : '实际删除'}`)
  console.log(`清理截止日期: ${ONE_YEAR_AGO.toISOString()}`)
  console.log('')

  let totalDeleted = 0

  // 1. 清理 study_records (学习记录)
  const studyRecords = await prisma.study_records.findMany({
    where: {
      createdAt: { lt: ONE_YEAR_AGO }
    },
    select: { id: true }
  })
  const studyCount = studyRecords.length
  if (dryRun) {
    console.log(`[DRY RUN] study_records: 将删除 ${studyCount} 条记录`)
  } else if (studyCount > 0) {
    await prisma.study_records.deleteMany({
      where: { createdAt: { lt: ONE_YEAR_AGO } }
    })
    console.log(`✓ study_records: 已删除 ${studyCount} 条记录`)
  }
  totalDeleted += studyCount

  // 2. 清理 test_records (测试记录)
  const testRecords = await prisma.test_records.findMany({
    where: {
      createdAt: { lt: ONE_YEAR_AGO }
    },
    select: { id: true }
  })
  const testCount = testRecords.length
  if (dryRun) {
    console.log(`[DRY RUN] test_records: 将删除 ${testCount} 条记录`)
  } else if (testCount > 0) {
    await prisma.test_records.deleteMany({
      where: { createdAt: { lt: ONE_YEAR_AGO } }
    })
    console.log(`✓ test_records: 已删除 ${testCount} 条记录`)
  }
  totalDeleted += testCount

  // 3. 清理 wrong_questions (错题记录) - 只删除1年前的
  const wrongQuestions = await prisma.wrong_questions.findMany({
    where: {
      createdAt: { lt: ONE_YEAR_AGO }
    },
    select: { id: true }
  })
  const wrongCount = wrongQuestions.length
  if (dryRun) {
    console.log(`[DRY RUN] wrong_questions: 将删除 ${wrongCount} 条记录`)
  } else if (wrongCount > 0) {
    await prisma.wrong_questions.deleteMany({
      where: { createdAt: { lt: ONE_YEAR_AGO } }
    })
    console.log(`✓ wrong_questions: 已删除 ${wrongCount} 条记录`)
  }
  totalDeleted += wrongCount

  // 4. 清理 question_answers (答题详情) - 通过 study_records 关联
  const answerRecords = await prisma.question_answers.findMany({
    where: {
      createdAt: { lt: ONE_YEAR_AGO }
    },
    select: { id: true }
  })
  const answerCount = answerRecords.length
  if (dryRun) {
    console.log(`[DRY RUN] question_answers: 将删除 ${answerCount} 条记录`)
  } else if (answerCount > 0) {
    await prisma.question_answers.deleteMany({
      where: { createdAt: { lt: ONE_YEAR_AGO } }
    })
    console.log(`✓ question_answers: 已删除 ${answerCount} 条记录`)
  }
  totalDeleted += answerCount

  // 5. 清理 point_history (积分历史) - 保留最近1年
  const pointHistory = await prisma.point_history.findMany({
    where: {
      createdAt: { lt: ONE_YEAR_AGO }
    },
    select: { id: true }
  })
  const pointCount = pointHistory.length
  if (dryRun) {
    console.log(`[DRY RUN] point_history: 将删除 ${pointCount} 条记录`)
  } else if (pointCount > 0) {
    await prisma.point_history.deleteMany({
      where: { createdAt: { lt: ONE_YEAR_AGO } }
    })
    console.log(`✓ point_history: 已删除 ${pointCount} 条记录`)
  }
  totalDeleted += pointCount

  console.log('')
  console.log('========================================')
  console.log(`总计: ${dryRun ? '将删除' : '已删除'} ${totalDeleted} 条记录`)
  console.log('========================================')

  if (dryRun) {
    console.log('')
    console.log('⚠️  这是模拟运行，没有实际删除数据')
    console.log('⚠️  如需实际删除，请设置 DRY_RUN=false')
    console.log('   例如: DRY_RUN=false DATABASE_URL="..." npx ts-node scripts/cleanup-old-data.ts')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
