const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/review-plan/[studentId]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `    // 7. 计算连续学习天数
    let consecutiveDays = 0
    const today = getTodayDate()
    let checkDate = new Date(today)

    while (true) {
      const record = await prisma.study_records.findFirst({
        where: {
          studentId,
          taskDate: checkDate,
          isCompleted: true,
        },
      })

      if (record) {
        consecutiveDays++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }

      if (consecutiveDays >= 365) break // 最多查询一年
    }`;

const newCode = `    // 7. 计算连续学习天数（P2优化：使用study_streaks表缓存）
    let consecutiveDays = 0
    const studyStreak = await prisma.study_streaks.findUnique({
      where: { studentId },
    })

    if (studyStreak) {
      const lastStudy = studyStreak.lastStudyDate
      const today = getTodayDate()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastStudy) {
        const lastStudyStr = new Date(lastStudy).toDateString()
        if (lastStudyStr === today.toDateString() || lastStudyStr === yesterday.toDateString()) {
          consecutiveDays = studyStreak.currentStreak
        }
      }
    }`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content);
  console.log('P2 连续天数优化完成');
} else {
  console.log('P2 代码已变更或已修复');
}
