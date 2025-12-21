const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// 从 lib/ebbinghaus.ts 复制的函数
function getTodayDate() {
  const now = new Date()
  // 转换为北京时间
  const beijingOffset = 8 * 60 // 北京时间 UTC+8
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const beijingMinutes = utcMinutes + beijingOffset

  const today = new Date(now)
  if (beijingMinutes >= 24 * 60) {
    // 已经是北京时间的第二天
    today.setUTCDate(today.getUTCDate() + 1)
  }
  today.setUTCHours(0, 0, 0, 0)
  return today
}

async function check() {
  const studentNo = '20001'
  const student = await prisma.students.findFirst({
    where: { student_no: studentNo }
  })

  const studyStreak = await prisma.study_streaks.findUnique({
    where: { studentId: student.id }
  })

  console.log('=== 日期比较调试 ===')
  console.log('当前 UTC 时间:', new Date().toISOString())

  const today = getTodayDate()
  console.log('getTodayDate():', today.toISOString())
  console.log('today.toDateString():', today.toDateString())

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  console.log('yesterday.toDateString():', yesterday.toDateString())

  if (studyStreak) {
    const lastStudy = studyStreak.lastStudyDate
    console.log('')
    console.log('lastStudyDate:', lastStudy)
    console.log('lastStudyDate ISO:', new Date(lastStudy).toISOString())
    const lastStudyStr = new Date(lastStudy).toDateString()
    console.log('lastStudyStr:', lastStudyStr)

    console.log('')
    console.log('比较结果:')
    console.log('  lastStudyStr === today.toDateString():', lastStudyStr === today.toDateString())
    console.log('  lastStudyStr === yesterday.toDateString():', lastStudyStr === yesterday.toDateString())

    let consecutiveDays = 0
    if (lastStudyStr === today.toDateString() || lastStudyStr === yesterday.toDateString()) {
      consecutiveDays = studyStreak.currentStreak
    }
    console.log('')
    console.log('最终 consecutiveDays:', consecutiveDays)
    console.log('数据库 currentStreak:', studyStreak.currentStreak)
  }
}

check().catch(console.error).finally(() => prisma.$disconnect())
