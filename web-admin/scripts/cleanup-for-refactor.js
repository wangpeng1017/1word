/**
 * 学习计划重构 - 数据清理脚本
 * 清空 daily_tasks, study_plans, plan_classes 表数据
 * 保留 word_masteries 数据
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('开始清理数据...\n')

  // 1. 清空 daily_tasks
  const dailyTasksCount = await prisma.daily_tasks.count()
  console.log(`daily_tasks 表当前记录数: ${dailyTasksCount}`)
  if (dailyTasksCount > 0) {
    await prisma.daily_tasks.deleteMany({})
    console.log('✓ daily_tasks 已清空')
  }

  // 2. 清空 study_plans
  const studyPlansCount = await prisma.study_plans.count()
  console.log(`study_plans 表当前记录数: ${studyPlansCount}`)
  if (studyPlansCount > 0) {
    await prisma.study_plans.deleteMany({})
    console.log('✓ study_plans 已清空')
  }

  // 3. 清空 plan_classes
  const planClassesCount = await prisma.plan_classes.count()
  console.log(`plan_classes 表当前记录数: ${planClassesCount}`)
  if (planClassesCount > 0) {
    await prisma.plan_classes.deleteMany({})
    console.log('✓ plan_classes 已清空')
  }

  // 4. 保留 word_masteries
  const wordMasteriesCount = await prisma.word_masteries.count()
  console.log(`\nword_masteries 表记录数: ${wordMasteriesCount} (已保留)`)

  console.log('\n数据清理完成!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
