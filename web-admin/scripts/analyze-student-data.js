// 分析学生学习数据问题
// 用于诊断 10002/10004 显示"已完成19个单词"的问题

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const studentNos = ['10001', '10002', '10003', '10004']
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  console.log('=== 学生数据分析 ===')
  console.log(`分析日期: ${today.toISOString().slice(0, 10)}`)
  console.log('')

  for (const studentNo of studentNos) {
    // 获取学生信息
    const student = await prisma.students.findUnique({
      where: { student_no: studentNo },
      include: { user: { select: { name: true } } }
    })

    if (!student) {
      console.log(`学生 ${studentNo}: 不存在`)
      continue
    }

    console.log(`\n=== 学生 ${studentNo} (${student.user.name}) ===`)
    console.log(`学生ID: ${student.id}`)

    // 查询今日任务
    const todayTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId: student.id,
        taskDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        vocabularies: { select: { word: true } }
      }
    })

    const completedTasks = todayTasks.filter(t => t.status === 'COMPLETED')
    const pendingTasks = todayTasks.filter(t => t.status === 'PENDING')
    const inProgressTasks = todayTasks.filter(t => t.status === 'IN_PROGRESS')

    console.log(`今日任务总数: ${todayTasks.length}`)
    console.log(`  - 已完成: ${completedTasks.length}`)
    console.log(`  - 进行中: ${inProgressTasks.length}`)
    console.log(`  - 待开始: ${pendingTasks.length}`)

    if (completedTasks.length > 0) {
      console.log('\n已完成的任务详情:')
      for (const task of completedTasks) {
        console.log(`  - ${task.vocabularies.word} | 完成时间: ${task.completedAt?.toISOString() || 'N/A'} | 创建时间: ${task.createdAt.toISOString()}`)
      }
    }

    // 查询今日学习记录
    const todayRecord = await prisma.study_records.findFirst({
      where: {
        studentId: student.id,
        taskDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (todayRecord) {
      console.log(`\n今日学习记录:`)
      console.log(`  - 总词数: ${todayRecord.totalWords}`)
      console.log(`  - 已完成: ${todayRecord.completedWords}`)
      console.log(`  - 正确数: ${todayRecord.correctCount}`)
      console.log(`  - 错误数: ${todayRecord.wrongCount}`)
      console.log(`  - 开始时间: ${todayRecord.startedAt?.toISOString() || 'N/A'}`)
      console.log(`  - 完成时间: ${todayRecord.completedAt?.toISOString() || 'N/A'}`)
    } else {
      console.log('\n今日无学习记录')
    }

    // 查询学习计划中今日应复习的词汇
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    const duePlans = await prisma.study_plans.count({
      where: {
        studentId: student.id,
        status: { in: ['IN_PROGRESS', 'PENDING'] },
        nextReviewAt: { lte: endOfToday }
      }
    })
    console.log(`\n今日应复习计划数: ${duePlans}`)
  }

  // 检查是否有跨天的任务被错误标记
  console.log('\n\n=== 检查异常数据 ===')

  const abnormalTasks = await prisma.daily_tasks.findMany({
    where: {
      status: 'COMPLETED',
      taskDate: {
        gte: today,
        lt: tomorrow
      },
      completedAt: {
        lt: today // 完成时间早于今天
      }
    },
    include: {
      students: { select: { student_no: true } },
      vocabularies: { select: { word: true } }
    }
  })

  if (abnormalTasks.length > 0) {
    console.log(`发现 ${abnormalTasks.length} 条异常数据（任务日期是今天但完成时间早于今天）:`)
    for (const task of abnormalTasks) {
      console.log(`  - 学号: ${task.students.student_no} | 单词: ${task.vocabularies.word} | 任务日期: ${task.taskDate.toISOString().slice(0, 10)} | 完成时间: ${task.completedAt?.toISOString()}`)
    }
  } else {
    console.log('未发现完成时间异常的数据')
  }

  // 检查今日任务的创建时间
  console.log('\n=== 检查今日任务创建时间 ===')
  const todayAllTasks = await prisma.daily_tasks.findMany({
    where: {
      taskDate: {
        gte: today,
        lt: tomorrow
      }
    },
    include: {
      students: { select: { student_no: true } },
      vocabularies: { select: { word: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  // 按学生分组统计
  const tasksByStudent = {}
  for (const task of todayAllTasks) {
    const no = task.students.student_no
    if (!tasksByStudent[no]) {
      tasksByStudent[no] = { total: 0, completed: 0, earliestCreate: null, latestComplete: null }
    }
    tasksByStudent[no].total++
    if (task.status === 'COMPLETED') {
      tasksByStudent[no].completed++
      if (!tasksByStudent[no].latestComplete || task.completedAt > tasksByStudent[no].latestComplete) {
        tasksByStudent[no].latestComplete = task.completedAt
      }
    }
    if (!tasksByStudent[no].earliestCreate || task.createdAt < tasksByStudent[no].earliestCreate) {
      tasksByStudent[no].earliestCreate = task.createdAt
    }
  }

  for (const [no, stats] of Object.entries(tasksByStudent)) {
    console.log(`学号 ${no}: 总任务 ${stats.total}, 已完成 ${stats.completed}, 最早创建 ${stats.earliestCreate?.toISOString()}, 最晚完成 ${stats.latestComplete?.toISOString() || 'N/A'}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
