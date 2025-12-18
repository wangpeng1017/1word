/**
 * 修复 daily_tasks 表中错误的 taskDate 数据
 *
 * 问题：某些学生的历史任务 taskDate 被错误设置为今天的日期
 * 解决：将 taskDate 修正为 createdAt 对应的日期
 *
 * 使用方法：
 *   node scripts/fix-task-dates.js --diagnose    # 仅诊断，不修改
 *   node scripts/fix-task-dates.js --fix         # 执行修复
 *   node scripts/fix-task-dates.js --fix --all   # 修复所有学生（不仅限于指定学号）
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

// 北京时间偏移量（毫秒）
const BEIJING_OFFSET = 8 * 60 * 60 * 1000

// 获取北京时间的今天日期（UTC 0点表示）
function getTodayBeijing() {
  const now = new Date()
  const beijingNow = new Date(now.getTime() + BEIJING_OFFSET)
  return new Date(Date.UTC(
    beijingNow.getUTCFullYear(),
    beijingNow.getUTCMonth(),
    beijingNow.getUTCDate()
  ))
}

// 将任意时间转换为北京时间的日期（去除时间部分）
function toBeijingDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const beijingTime = new Date(d.getTime() + BEIJING_OFFSET)
  return new Date(Date.UTC(
    beijingTime.getUTCFullYear(),
    beijingTime.getUTCMonth(),
    beijingTime.getUTCDate()
  ))
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

// 判断两个日期是否是同一天
function isSameDay(date1, date2) {
  return formatDate(toBeijingDate(date1)) === formatDate(toBeijingDate(date2))
}

async function diagnose(studentNos = ['10004', '10005', '10006']) {
  console.log('=== 数据诊断 ===\n')

  const today = getTodayBeijing()
  const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)

  console.log(`今天日期（北京时间）: ${formatDate(today)}`)
  console.log(`查询范围: ${today.toISOString()} ~ ${endOfToday.toISOString()}\n`)

  // 获取指定学号的学生
  const students = await prisma.students.findMany({
    where: {
      student_no: { in: studentNos }
    },
    select: {
      id: true,
      student_no: true
    }
  })

  if (students.length === 0) {
    console.log('未找到指定学号的学生')
    return []
  }

  console.log(`找到 ${students.length} 个学生:\n`)

  const problemTasks = []

  for (const student of students) {
    console.log(`--- 学生 ${student.student_no} (${student.id}) ---`)

    // 查询今日任务
    const todayTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId: student.id,
        taskDate: { gte: today, lte: endOfToday }
      },
      include: {
        vocabularies: {
          select: { word: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`今日任务总数: ${todayTasks.length}`)
    console.log(`已完成: ${todayTasks.filter(t => t.status === 'COMPLETED').length}`)
    console.log(`待完成: ${todayTasks.filter(t => t.status !== 'COMPLETED').length}`)

    // 分析问题任务（createdAt 不是今天，但 taskDate 是今天）
    const suspiciousTasks = todayTasks.filter(task => {
      const createdDate = toBeijingDate(task.createdAt)
      return !isSameDay(createdDate, today)
    })

    if (suspiciousTasks.length > 0) {
      console.log(`\n⚠️ 发现 ${suspiciousTasks.length} 个可疑任务（createdAt 不是今天）:`)

      for (const task of suspiciousTasks) {
        const createdDate = toBeijingDate(task.createdAt)
        console.log(`  - ${task.vocabularies?.word || '未知'}: status=${task.status}, createdAt=${formatDate(createdDate)}, taskDate=${formatDate(task.taskDate)}`)

        problemTasks.push({
          id: task.id,
          studentId: student.id,
          studentNo: student.student_no,
          word: task.vocabularies?.word,
          status: task.status,
          createdAt: task.createdAt,
          taskDate: task.taskDate,
          correctTaskDate: createdDate
        })
      }
    } else {
      console.log('\n✅ 未发现问题任务')
    }

    console.log('')
  }

  return problemTasks
}

async function fix(problemTasks) {
  if (problemTasks.length === 0) {
    console.log('没有需要修复的任务')
    return
  }

  console.log(`\n=== 开始修复 ${problemTasks.length} 个任务 ===\n`)

  let fixedCount = 0
  let deletedCount = 0

  for (const task of problemTasks) {
    try {
      await prisma.daily_tasks.update({
        where: { id: task.id },
        data: {
          taskDate: task.correctTaskDate,
          updatedAt: new Date()
        }
      })

      console.log(`✅ 已修复: ${task.word} (${task.studentNo}) - taskDate: ${formatDate(task.taskDate)} → ${formatDate(task.correctTaskDate)}`)
      fixedCount++
    } catch (error) {
      // 如果是唯一约束冲突，说明目标日期已存在相同任务，删除这个重复记录
      if (error.message.includes('Unique constraint failed')) {
        try {
          await prisma.daily_tasks.delete({
            where: { id: task.id }
          })
          console.log(`🗑️ 已删除重复: ${task.word} (${task.studentNo}) - 目标日期 ${formatDate(task.correctTaskDate)} 已存在相同任务`)
          deletedCount++
        } catch (deleteError) {
          console.error(`❌ 删除失败: ${task.word} (${task.studentNo}) - ${deleteError.message}`)
        }
      } else {
        console.error(`❌ 修复失败: ${task.word} (${task.studentNo}) - ${error.message}`)
      }
    }
  }

  console.log(`\n修复完成: 修复 ${fixedCount} 个, 删除重复 ${deletedCount} 个, 共 ${problemTasks.length} 个`)
}

async function diagnoseAll() {
  console.log('=== 全量数据诊断（所有204个学生）===\n')

  const today = getTodayBeijing()
  const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)

  console.log(`今天日期（北京时间）: ${formatDate(today)}\n`)

  // 查询所有今日任务（所有状态）
  const allTodayTasks = await prisma.daily_tasks.findMany({
    where: {
      taskDate: { gte: today, lte: endOfToday }
    },
    include: {
      vocabularies: { select: { word: true } },
      students: { select: { student_no: true } }
    }
  })

  console.log(`今日任务总数: ${allTodayTasks.length}`)
  console.log(`  - COMPLETED: ${allTodayTasks.filter(t => t.status === 'COMPLETED').length}`)
  console.log(`  - PENDING: ${allTodayTasks.filter(t => t.status === 'PENDING').length}`)
  console.log(`  - IN_PROGRESS: ${allTodayTasks.filter(t => t.status === 'IN_PROGRESS').length}`)
  console.log(`  - INTERRUPTED: ${allTodayTasks.filter(t => t.status === 'INTERRUPTED').length}`)

  // 分析问题任务（createdAt 不是今天，但 taskDate 是今天）
  const problemTasks = allTodayTasks.filter(task => {
    const createdDate = toBeijingDate(task.createdAt)
    return !isSameDay(createdDate, today)
  })

  console.log(`\n其中 createdAt 不是今天的（问题数据）: ${problemTasks.length}`)

  if (problemTasks.length > 0) {
    console.log('\n问题任务详情:')

    // 按学生分组
    const byStudent = {}
    for (const task of problemTasks) {
      const studentNo = task.students?.student_no || '未知'
      if (!byStudent[studentNo]) {
        byStudent[studentNo] = []
      }
      byStudent[studentNo].push(task)
    }

    const studentCount = Object.keys(byStudent).length
    console.log(`涉及学生数: ${studentCount}`)

    for (const [studentNo, tasks] of Object.entries(byStudent)) {
      const completed = tasks.filter(t => t.status === 'COMPLETED').length
      const pending = tasks.filter(t => t.status === 'PENDING').length
      const other = tasks.length - completed - pending
      console.log(`  学生 ${studentNo}: ${tasks.length} 个问题任务 (COMPLETED: ${completed}, PENDING: ${pending}, 其他: ${other})`)
    }
  }

  return problemTasks.map(task => ({
    id: task.id,
    studentId: task.studentId,
    studentNo: task.students?.student_no,
    word: task.vocabularies?.word,
    status: task.status,
    createdAt: task.createdAt,
    taskDate: task.taskDate,
    correctTaskDate: toBeijingDate(task.createdAt)
  }))
}

async function main() {
  const args = process.argv.slice(2)
  const isDiagnose = args.includes('--diagnose')
  const isFix = args.includes('--fix')
  const isAll = args.includes('--all')

  if (!isDiagnose && !isFix) {
    console.log('使用方法:')
    console.log('  node scripts/fix-task-dates.js --diagnose    # 仅诊断指定学号')
    console.log('  node scripts/fix-task-dates.js --diagnose --all  # 诊断所有学生')
    console.log('  node scripts/fix-task-dates.js --fix         # 修复指定学号')
    console.log('  node scripts/fix-task-dates.js --fix --all   # 修复所有学生')
    return
  }

  try {
    let problemTasks

    if (isAll) {
      problemTasks = await diagnoseAll()
    } else {
      problemTasks = await diagnose()
    }

    if (isFix && problemTasks.length > 0) {
      await fix(problemTasks)
    } else if (isDiagnose && problemTasks.length > 0) {
      console.log('\n💡 提示: 使用 --fix 参数执行修复')
    }
  } catch (error) {
    console.error('执行失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
