const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 查找学生
  const student = await prisma.students.findFirst({
    where: { student_no: '10001' },
    select: { id: true, student_no: true }
  });
  console.log('学生:', student);

  if (!student) return;

  // 获取今日日期范围 (UTC)
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  console.log('今日范围:', todayStart.toISOString(), '-', todayEnd.toISOString());

  // 查询今日任务
  const tasks = await prisma.daily_tasks.findMany({
    where: {
      studentId: student.id,
      taskDate: { gte: todayStart, lte: todayEnd }
    },
    select: {
      id: true,
      vocabularyId: true,
      status: true,
      taskDate: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log('\n今日任务数:', tasks.length);
  console.log('状态统计:');
  const statusCount = {};
  tasks.forEach(t => {
    statusCount[t.status] = (statusCount[t.status] || 0) + 1;
  });
  console.log(statusCount);

  // 检查是否有重复的 vocabularyId
  const vocabIds = tasks.map(t => t.vocabularyId);
  const uniqueVocabIds = [...new Set(vocabIds)];
  console.log('\n词汇ID数:', vocabIds.length, '唯一词汇ID数:', uniqueVocabIds.length);

  if (vocabIds.length !== uniqueVocabIds.length) {
    console.log('存在重复词汇!');
    const counts = {};
    vocabIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    Object.entries(counts).filter(([k, v]) => v > 1).forEach(([k, v]) => {
      console.log(`  ${k}: ${v}次`);
    });
  }

  // 显示任务详情
  console.log('\n任务详情:');
  tasks.forEach((t, i) => {
    console.log(`${i+1}. ${t.status.padEnd(12)} vocabId:${t.vocabularyId.slice(0,15)}... taskDate:${t.taskDate.toISOString().slice(0,10)} created:${t.createdAt.toISOString()}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
