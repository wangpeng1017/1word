// 应用时区修复
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');

// 1. 修复 task-interrupt-detector.ts
console.log('修复 lib/task-interrupt-detector.ts...');
const taskInterruptPath = path.join(baseDir, 'lib/task-interrupt-detector.ts');
let taskInterruptContent = fs.readFileSync(taskInterruptPath, 'utf8');

// 添加导入
if (!taskInterruptContent.includes('getTodayBeijing')) {
  taskInterruptContent = taskInterruptContent.replace(
    "import { prisma } from '@/lib/prisma'",
    "import { prisma } from '@/lib/prisma'\nimport { getTodayBeijing } from '@/lib/date-utils'"
  );
}

// 替换 detectCrossDayInterruptedTasks 中的今天计算
taskInterruptContent = taskInterruptContent.replace(
  /const today = new Date\(\)\s*\n\s*today\.setHours\(0, 0, 0, 0\)/g,
  'const today = getTodayBeijing()'
);

fs.writeFileSync(taskInterruptPath, taskInterruptContent, 'utf8');
console.log('  完成');

// 2. 修复 lib/cron/data-archive.ts
console.log('修复 lib/cron/data-archive.ts...');
const dataArchivePath = path.join(baseDir, 'lib/cron/data-archive.ts');
if (fs.existsSync(dataArchivePath)) {
  let dataArchiveContent = fs.readFileSync(dataArchivePath, 'utf8');

  // 添加导入
  if (!dataArchiveContent.includes('getTodayBeijing')) {
    dataArchiveContent = dataArchiveContent.replace(
      "import { prisma } from '@/lib/prisma'",
      "import { prisma } from '@/lib/prisma'\nimport { getTodayBeijing } from '@/lib/date-utils'"
    );
  }

  // 替换日期计算 - cutoffDate.setHours(0, 0, 0, 0) 模式
  // 这个文件计算的是 N 天前的日期，需要基于北京时间的今天
  dataArchiveContent = dataArchiveContent.replace(
    /const cutoffDate = new Date\(\)\s*\n\s*cutoffDate\.setDate\(cutoffDate\.getDate\(\) - (\d+)\)\s*\n\s*cutoffDate\.setHours\(0, 0, 0, 0\)/g,
    (match, days) => `const today = getTodayBeijing()\n  const cutoffDate = new Date(today.getTime() - ${days} * 24 * 60 * 60 * 1000)`
  );

  fs.writeFileSync(dataArchivePath, dataArchiveContent, 'utf8');
  console.log('  完成');
} else {
  console.log('  文件不存在，跳过');
}

// 3. 修复 lib/ebbinghaus.ts 中的 shouldReviewToday 和 daysBetween
console.log('修复 lib/ebbinghaus.ts...');
const ebbinghausPath = path.join(baseDir, 'lib/ebbinghaus.ts');
let ebbinghausContent = fs.readFileSync(ebbinghausPath, 'utf8');

// 添加导入
if (!ebbinghausContent.includes('toBeijingDate')) {
  // 在文件开头添加导入
  ebbinghausContent = `import { toBeijingDate, getTodayBeijing } from '@/lib/date-utils'\n\n` + ebbinghausContent;
}

// 修复 shouldReviewToday 函数
const oldShouldReview = `export function shouldReviewToday(nextReviewDate: Date, today: Date = new Date()): boolean {
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)

  const reviewDateStart = new Date(nextReviewDate)
  reviewDateStart.setHours(0, 0, 0, 0)

  return reviewDateStart <= todayStart
}`;

const newShouldReview = `export function shouldReviewToday(nextReviewDate: Date, today: Date = new Date()): boolean {
  const todayStart = toBeijingDate(today)
  const reviewDateStart = toBeijingDate(nextReviewDate)
  return reviewDateStart <= todayStart
}`;

ebbinghausContent = ebbinghausContent.replace(oldShouldReview, newShouldReview);

// 修复 daysBetween 函数
const oldDaysBetween = `export function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}`;

const newDaysBetween = `export function daysBetween(date1: Date, date2: Date): number {
  const d1 = toBeijingDate(date1)
  const d2 = toBeijingDate(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}`;

ebbinghausContent = ebbinghausContent.replace(oldDaysBetween, newDaysBetween);

fs.writeFileSync(ebbinghausPath, ebbinghausContent, 'utf8');
console.log('  完成');

console.log('\n=== 所有时区修复已应用 ===');
