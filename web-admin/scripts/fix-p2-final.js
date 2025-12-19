const fs = require('fs');
const path = require('path');

// P2-1: 修复连续天数计算
function fixConsecutiveDays() {
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
    console.log('✅ P2-1: 连续天数优化完成');
    return true;
  } else {
    console.log('⚠️ P2-1: 代码已变更或已修复');
    return false;
  }
}

// P2-2: 在study-records中更新recentAccuracy
function fixRecentAccuracy() {
  const filePath = path.join(__dirname, '../app/api/study-records/route.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // 在updateMasteries函数中添加recentAccuracy更新
  const oldCode = `            totalWrongCount: newWrongCount,
            consecutiveCorrect: a.isCorrect ? existing.consecutiveCorrect + 1 : 0,
            isMastered,
            isDifficult: isDifficult(newWrongCount),
            lastPracticeAt: now,
            updatedAt: now,`;

  const newCode = `            totalWrongCount: newWrongCount,
            consecutiveCorrect: a.isCorrect ? existing.consecutiveCorrect + 1 : 0,
            isMastered,
            isDifficult: isDifficult(newWrongCount),
            recentAccuracy: a.isCorrect ? Math.min(1, (existing.recentAccuracy || 0) + 0.1) : Math.max(0, (existing.recentAccuracy || 0) - 0.2),
            lastPracticeAt: now,
            updatedAt: now,`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content);
    console.log('✅ P2-2: recentAccuracy更新完成');
    return true;
  } else {
    console.log('⚠️ P2-2: 代码已变更或已修复');
    return false;
  }
}

console.log('开始P2优化...\n');
fixConsecutiveDays();
fixRecentAccuracy();
console.log('\nP2优化完成！');
