// scripts/reset-points.js
// 重置周期性积分的脚本

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetDailyPoints() {
  console.log('开始重置每日积分...')

  const result = await prisma.student_points.updateMany({
    data: {
      dailyPoints: 0,
      updatedAt: new Date()
    }
  })

  console.log(`✅ 已重置 ${result.count} 个学生的每日积分`)
  return result.count
}

async function resetWeeklyPoints() {
  console.log('开始重置每周积分...')

  const result = await prisma.student_points.updateMany({
    data: {
      weeklyPoints: 0,
      updatedAt: new Date()
    }
  })

  console.log(`✅ 已重置 ${result.count} 个学生的每周积分`)
  return result.count
}

async function resetMonthlyPoints() {
  console.log('开始重置每月积分...')

  const result = await prisma.student_points.updateMany({
    data: {
      monthlyPoints: 0,
      updatedAt: new Date()
    }
  })

  console.log(`✅ 已重置 ${result.count} 个学生的每月积分`)
  return result.count
}

async function main() {
  const args = process.argv.slice(2)
  const type = args[0] || 'daily'

  console.log(`\n📅 积分重置任务 - ${new Date().toLocaleString('zh-CN')}`)
  console.log(`重置类型: ${type}\n`)

  try {
    switch (type) {
      case 'daily':
        await resetDailyPoints()
        break
      case 'weekly':
        await resetWeeklyPoints()
        break
      case 'monthly':
        await resetMonthlyPoints()
        break
      case 'all':
        await resetDailyPoints()
        await resetWeeklyPoints()
        await resetMonthlyPoints()
        break
      default:
        console.error('❌ 无效的重置类型，请使用: daily, weekly, monthly, all')
        process.exit(1)
    }

    console.log('\n✅ 积分重置完成！')
  } catch (error) {
    console.error('❌ 积分重置失败:', error)
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('执行失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
