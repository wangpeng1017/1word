const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/review-plan/[studentId]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 修复被压缩成一行的代码
const badLine = `// 7. 计算连续学习天数（P2优化：使用study_streaks表缓存）    let consecutiveDays = 0    const studyStreak = await prisma.study_streaks.findUnique({      where: { studentId },    })    if (studyStreak) {      const lastStudy = studyStreak.lastStudyDate      const today = getTodayDate()      const yesterday = new Date(today)      yesterday.setDate(yesterday.getDate() - 1)      if (lastStudy) {        const lastStudyStr = new Date(lastStudy).toDateString()        if (lastStudyStr === today.toDateString() || lastStudyStr === yesterday.toDateString()) {          consecutiveDays = studyStreak.currentStreak        }      }    }`;

const goodCode = `    // 7. 计算连续学习天数（P2优化：使用study_streaks表缓存）
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

if (content.includes(badLine)) {
  content = content.replace(badLine, goodCode);
  fs.writeFileSync(filePath, content);
  console.log('✅ P2-1格式修复完成');
} else {
  console.log('⚠️ 未找到需要修复的代码');
}
