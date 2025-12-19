// 深入分析任务日期问题
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // 使用北京时间
  const now = new Date()
  const beijingOffset = 8 * 60 * 60 * 1000
  const beijingTime = new Date(now.getTime() + beijingOffset)
  const year = beijingTime.getUTCFullYear()
  const month = beijingTime.getUTCMonth()
  const day = beijingTime.getUTCDate()
  const todayBeijing = new Date(Date.UTC(year, month, day))
  const yesterdayBeijing = new Date(todayBeijing.getTime() - 86400000)

  console.log('=== 时间信息 ===')
  console.log('当前 UTC:', now.toISOString())
  console.log('北京时间今天:', todayBeijing.toISOString().slice(0, 10))
  console.log('北京时间昨天:', yesterdayBeijing.toISOString().slice(0, 10))

  // 查询 10001-10004 的所有任务
  const students = await prisma.students.findMany({
    where: {
      student_no: { in: ['10001', '10002', '10003', '10004'] }
    }
  })

  for (const student of students) {
    console.log(`\n=== 学号 ${student.student_no} ===`)

    // 获取所有任务，按日期分组
    const tasks = await prisma.daily_tasks.findMany({
      where: { studentId: student.id },
      orderBy: { taskDate: 'desc' }
    })

    // 按 taskDate 分组
    const byDate = {}
    for (const task of tasks) {
      const dateStr = task.taskDate.toISOString().slice(0, 10)
      if (!byDate[dateStr]) {
        byDate[dateStr] = { total: 0, completed: 0, pending: 0 }
      }
      byDate[dateStr].total++
      if (task.status === 'COMPLETED') byDate[dateStr].completed++
      else if (task.status === 'PENDING') byDate[dateStr].pending++
    }

    for (const [date, stats] of Object.entries(byDate)) {
      const isToday = date === todayBeijing.toISOString().slice(0, 10)
      const isYesterday = date === yesterdayBeijing.toISOString().slice(0, 10)
      let label = ''
      if (isToday) label = ' ← 今天(北京)'
      else if (isYesterday) label = ' ← 昨天(北京)'
      console.log(`  ${date}: 总 ${stats.total}, 完成 ${stats.completed}, 待开始 ${stats.pending}${label}`)
    }
  }

  // 关键问题：检查 taskDate 是 2025-12-18 但实际是昨天创建的任务
  console.log('\n=== 关键分析 ===')
  const dec18Tasks = await prisma.daily_tasks.findMany({
    where: {
      taskDate: todayBeijing, // 2025-12-18
      status: 'COMPLETED'
    },
    include: {
      students: { select: { student_no: true } }
    }
  })

  console.log(`taskDate = 2025-12-18 且已完成的任务数: ${dec18Tasks.length}`)
  if (dec18Tasks.length > 0) {
    const byStudent = {}
    for (const t of dec18Tasks) {
      const no = t.students.student_no
      if (!byStudent[no]) byStudent[no] = { count: 0, completedAt: [] }
      byStudent[no].count++
      if (t.completedAt) byStudent[no].completedAt.push(t.completedAt.toISOString())
    }
    for (const [no, data] of Object.entries(byStudent)) {
      console.log(`  学号 ${no}: ${data.count} 个`)
      if (data.completedAt.length > 0) {
        // 检查完成时间是否在今天（北京时间）
        const completedBeijing = data.completedAt.map(t => {
          const d = new Date(t)
          const bj = new Date(d.getTime() + beijingOffset)
          return bj.toISOString().slice(0, 10)
        })
        const uniqueDates = [...new Set(completedBeijing)]
        console.log(`    完成日期(北京时间): ${uniqueDates.join(', ')}`)
      }
    }
  }

  // 检查 taskDate = 2025-12-17 的任务
  const dec17Tasks = await prisma.daily_tasks.findMany({
    where: {
      taskDate: yesterdayBeijing, // 2025-12-17
      status: 'COMPLETED'
    },
    include: {
      students: { select: { student_no: true } }
    }
  })

  console.log(`\ntaskDate = 2025-12-17 且已完成的任务数: ${dec17Tasks.length}`)
  if (dec17Tasks.length > 0) {
    const byStudent = {}
    for (const t of dec17Tasks) {
      const no = t.students.student_no
      if (!byStudent[no]) byStudent[no] = { count: 0, completedAt: [] }
      byStudent[no].count++
      if (t.completedAt) byStudent[no].completedAt.push(t.completedAt.toISOString())
    }
    for (const [no, data] of Object.entries(byStudent)) {
      console.log(`  学号 ${no}: ${data.count} 个`)
      if (data.completedAt.length > 0) {
        const completedBeijing = data.completedAt.map(t => {
          const d = new Date(t)
          const bj = new Date(d.getTime() + beijingOffset)
          return bj.toISOString().slice(0, 10)
        })
        const uniqueDates = [...new Set(completedBeijing)]
        console.log(`    完成日期(北京时间): ${uniqueDates.join(', ')}`)
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
