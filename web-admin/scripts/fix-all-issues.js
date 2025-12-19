/**
 * 修复所有统计模块逻辑漏洞
 * 运行: node scripts/fix-all-issues.js
 */

const fs = require('fs');
const path = require('path');

// P0: 修复小程序profile.js - 统一使用word_masteries作为数据源
function fixP0() {
  const filePath = path.join(__dirname, '../../wechat-miniapp/pages/profile/profile.js');
  let content = fs.readFileSync(filePath, 'utf8');

  const oldCode = `const overview = await get(\`/review-plan/\${studentId}\`)
      const progress = overview?.miniapp?.progress || {}

      const records = await get(\`/study-records?studentId=\${studentId}&limit=7\`)
      const wrongCount = Array.isArray(records) ? records.reduce((sum, r) => sum + (r.wrongCount || 0), 0) : 0

      this.setData({
        stats: {
          totalWords: progress.totalWords || 0,
          masteredWords: progress.masteredWords || 0,
          difficultWords: progress.difficultWords || 0,
          studyDays: progress.consecutiveDays || 0,
          wrongCount,
        },
      })`;

  const newCode = `// 统一使用 word_masteries 作为掌握度数据源
      const [overview, masteryData] = await Promise.all([
        get(\`/review-plan/\${studentId}\`),
        get(\`/word-mastery?studentId=\${studentId}&limit=1000\`)
      ])
      const progress = overview?.miniapp?.progress || {}

      // 从 word_masteries 计算真实的已掌握数和难点数
      const masteryRecords = masteryData?.records || []
      const realMasteredWords = masteryRecords.filter(m => m.masteredCount > 0).length
      const realDifficultWords = masteryRecords.filter(m => m.difficultCount > 0).length

      const records = await get(\`/study-records?studentId=\${studentId}&limit=7\`)
      const wrongCount = Array.isArray(records) ? records.reduce((sum, r) => sum + (r.wrongCount || 0), 0) : 0

      this.setData({
        stats: {
          totalWords: progress.totalWords || 0,
          masteredWords: realMasteredWords || progress.masteredWords || 0,
          difficultWords: realDifficultWords || progress.difficultWords || 0,
          studyDays: progress.consecutiveDays || 0,
          wrongCount,
        },
      })`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content);
    console.log('✅ P0: profile.js 已修复');
  } else {
    console.log('⚠️ P0: profile.js 代码已变更或已修复');
  }
}

// P1: 修复离线同步逐条清除
function fixP1_OfflineSync() {
  const filePath = path.join(__dirname, '../../wechat-miniapp/pages/index/index.js');
  let content = fs.readFileSync(filePath, 'utf8');

  const oldCode = `try {
      for (const item of syncQueue) {
        if (item.type === 'study_complete') {
          await post('/study-records', {
            studentId: item.data.studentId,
            answers: item.data.answers,
          })
          console.log('[同步] 学习记录同步成功')
        }
      }

      // 同步成功，清空队列
      clearSyncQueue()`;

  const newCode = `try {
      let successCount = 0
      for (let i = 0; i < syncQueue.length; i++) {
        const item = syncQueue[i]
        if (item.type === 'study_complete') {
          try {
            await post('/study-records', {
              studentId: item.data.studentId,
              answers: item.data.answers,
            })
            console.log('[同步] 学习记录同步成功')
            successCount++
          } catch (itemError) {
            // 单条失败，保留剩余队列
            console.error('[同步] 单条同步失败，保留剩余队列', itemError)
            const remaining = syncQueue.slice(i)
            wx.setStorageSync('syncQueue', remaining)
            throw itemError
          }
        }
      }

      // 全部成功，清空队列
      clearSyncQueue()`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content);
    console.log('✅ P1: index.js 离线同步已修复');
  } else {
    console.log('⚠️ P1: index.js 代码已变更或已修复');
  }
}

// 执行所有修复
console.log('开始修复统计模块逻辑漏洞...\n');
fixP0();
fixP1_OfflineSync();
console.log('\n小程序端修复完成！');
