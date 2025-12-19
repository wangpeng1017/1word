// 批量修复所有时区问题
const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'lib/task-interrupt-detector.ts',
  'lib/ebbinghaus.ts',
  'lib/cron/data-archive.ts',
  'lib/cron/reset-points.ts',
  'app/api/review-plan/[studentId]/route.ts',
  'app/api/study-records/route.ts',
  'app/api/students/[id]/daily-tasks/route.ts',
  'app/api/daily-tasks/route.ts',
  'app/api/statistics/[studentId]/route.ts',
  'app/api/statistics/overview/route.ts',
  'app/api/statistics/rankings/route.ts',
];

// 读取并分析每个文件
console.log('=== 分析需要修复的文件 ===\n');

for (const file of filesToFix) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`[跳过] ${file} - 文件不存在`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // 检查是否有时区相关代码
  const hasSetHours = content.includes('setHours(0');
  const hasTodayNew = content.includes('const today = new Date()');
  const hasGetTodayDate = content.includes('getTodayDate()');
  const hasDateUtils = content.includes('date-utils');

  if (hasSetHours || hasTodayNew || hasGetTodayDate) {
    console.log(`[需修复] ${file}`);
    if (hasSetHours) console.log('  - 使用了 setHours(0,0,0,0)');
    if (hasTodayNew) console.log('  - 使用了 const today = new Date()');
    if (hasGetTodayDate) console.log('  - 使用了 getTodayDate()');
    if (hasDateUtils) console.log('  - 已导入 date-utils');
  } else {
    console.log(`[正常] ${file}`);
  }
}

console.log('\n=== 修复建议 ===');
console.log('1. 将 "const today = new Date(); today.setHours(0,0,0,0)" 替换为 "import { getTodayBeijing } from \'@/lib/date-utils\'; const today = getTodayBeijing()"');
console.log('2. 将 getTodayDate() 替换为 getTodayBeijing()（已在 ebbinghaus.ts 中修复）');
console.log('3. date-utils.ts 已更新，旧函数会自动使用北京时间');
