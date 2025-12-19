const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/study-records/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `    // 异步更新积分和成就（非关键路径）
    const pointsPromise = updatePointsAsync(studentId, correctCount, totalWords, accuracy, srId)

    checkAndUnlockAchievements(studentId)
      .catch(err => console.error('成就检查失败:', err))

    const pointsResult = await pointsPromise`;

const newCode = `    // 更新连续学习天数（study_streaks）
    try {
      const existingStreak = await prisma.study_streaks.findUnique({
        where: { studentId },
      })

      const todayStr = todayUTC.toDateString()

      if (existingStreak) {
        const lastStudyStr = existingStreak.lastStudyDate?.toDateString()
        const yesterday = new Date(todayUTC)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toDateString()

        let newStreak = 1
        if (lastStudyStr === todayStr) {
          // 今天已学习，保持不变
          newStreak = existingStreak.currentStreak
        } else if (lastStudyStr === yesterdayStr) {
          // 昨天学习过，连续+1
          newStreak = existingStreak.currentStreak + 1
        }
        // 否则重置为1

        await prisma.study_streaks.update({
          where: { studentId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(existingStreak.longestStreak, newStreak),
            lastStudyDate: todayUTC,
            updatedAt: now,
          },
        })
      } else {
        // 首次学习，创建记录
        await prisma.study_streaks.create({
          data: {
            id: \`ss_\${Date.now()}_\${Math.random().toString(36).slice(2, 8)}\`,
            studentId,
            currentStreak: 1,
            longestStreak: 1,
            lastStudyDate: todayUTC,
          },
        })
      }
    } catch (err) {
      console.error('更新连续学习天数失败:', err)
    }

    // 异步更新积分和成就（非关键路径）
    const pointsPromise = updatePointsAsync(studentId, correctCount, totalWords, accuracy, srId)

    checkAndUnlockAchievements(studentId)
      .catch(err => console.error('成就检查失败:', err))

    const pointsResult = await pointsPromise`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content);
  console.log('✅ study_streaks更新逻辑已添加');
} else {
  console.log('⚠️ 代码已变更或已修复');
}
