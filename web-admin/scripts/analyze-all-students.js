// 分析所有学生的学习数据
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // 使用北京时间计算今天
  const now = new Date()
  const beijingOffset = 8 * 60 * 60 * 1000
  const beijingTime = new Date(now.getTime() + beijingOffset)
  const year = beijingTime.getUTCFullYear()
  const month = beijingTime.getUTCMonth()
  const day = beijingTime.getUTCDate()
  const todayBeijing = new Date(Date.UTC(year, month, day))
  const yesterdayBeijing = new Date(todayBeijing.getTime() - 86400000)

  console.log('=== 时间信息 ===')
  console.log('当前 UTC 时间:', now.toISOString())
  console.log('北京时间今天:', todayBeijing.toISOString().slice(0, 10))
  console.log('北京时间昨天:', yesterdayBeijing.toISOString().slice(0, 10))
  console.log('')

  // 查询昨天（北京时间）有已完成任务的学生
  const yesterdayCompletedTasks = await prisma.daily_tasks.findMany({
    where: {
      taskDate: yesterdayBeijing,
      status: 'COMPLETED'
    },
    include: {
      students: {
        select: {
          student_no: true,
          user: { select: { name: true } }
        }
      }
    }
  })

  // 按学生分组
  const yesterdayByStudent = {}
  for (const task of yesterdayCompletedTasks) {
    const no = task.students.student_no
    const name = task.students.user?.name || 'unknown'
    if (!yesterdayByStudent[no]) {
      yesterdayByStudent[no] = { name, count: 0, completedAt: [] }
    }
    yesterdayByStudent[no].count++
    if (task.completedAt) {
      yesterdayByStudent[no].completedAt.push(task.completedAt.toISOString())
    }
  }

  console.log('=== 昨天（北京时间）有已完成任务的学生 ===')
  if (Object.keys(yesterdayByStudent).length === 0) {
    console.log('无')
  } else {
    for (const [no, data] of Object.entries(yesterdayByStudent)) {
      console.log(`学号 ${no} (${data.name}): ${data.count} 个已完成`)
      // 显示最早和最晚完成时间
      if (data.completedAt.length > 0) {
        const sorted = data.completedAt.sort()
        console.log(`  完成时间范围: ${sorted[0]} ~ ${sorted[sorted.length - 1]}`)
      }
    }
  }

  // 查询今天（北京时间）的任务
  console.log('\n=== 今天（北京时间）的任务统计 ===')
  const todayTasks = await prisma.daily_tasks.findMany({
    where: {
      taskDate: todayBeijing
    },
    include: {
      students: {
        select: {
          student_no: true,
          user: { select: { name: true } }
        }
      }
    }
  })

  const todayByStudent = {}
  for (const task of todayTasks) {
    const no = task.students.student_no
    const name = task.students.user?.name || 'unknown'
    if (!todayByStudent[no]) {
      todayByStudent[no] = { name, total: 0, completed: 0, pending: 0, inProgress: 0 }
    }
    todayByStudent[no].total++
    if (task.status === 'COMPLETED') todayByStudent[no].completed++
    else if (task.status === 'PENDING') todayByStudent[no].pending++
    else if (task.status === 'IN_PROGRESS') todayByStudent[no].inProgress++
  }

  if (Object.keys(todayByStudent).length === 0) {
    console.log('今天无任务')
  } else {
    for (const [no, stats] of Object.entries(todayByStudent)) {
      if (stats.completed > 0 || stats.inProgress > 0) {
        console.log(`学号 ${no} (${stats.name}): 总 ${stats.total}, 已完成 ${stats.completed}, 进行中 ${stats.inProgress}, 待开始 ${stats.pending}`)
      }
    }
  }

  // 检查需要修复的数据：昨天的任务被错误地显示为今天
  console.log('\n=== 需要修复的数据 ===')
  console.log('问题：由于时区问题，昨天（北京时间）的已完成任务可能被错误显示为今天的数据')
  console.log('这些学生在昨天完成了学习，但今天登录时会看到"已完成"状态：')

  const affectedStudents = Object.keys(yesterdayByStudent)
  if (affectedStudents.length === 0) {
    console.log('无需修复')
  } else {
    console.log(`受影响学生: ${affectedStudents.join(', ')}`)
    console.log('\n修复方案：时区代码已修复，部署后新的查询将使用正确的北京时间日期')
    console.log('历史数据无需修改，因为数据本身是正确的，只是查询时使用了错误的日期')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
