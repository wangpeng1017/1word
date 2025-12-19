const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const studentId = 'student_1765845935779_k3dvdv2g';

  // 答题记录
  const answers = await prisma.question_answers.findMany({
    where: { studentId },
    include: { vocabularies: { select: { word: true } } },
    orderBy: { answeredAt: 'asc' }
  });
  console.log('=== 答题记录 ===');
  console.log('总数:', answers.length);

  // 学习记录
  const records = await prisma.study_records.findMany({
    where: { studentId },
    orderBy: { taskDate: 'asc' }
  });
  console.log('\n=== 学习记录 ===');
  records.forEach(r => {
    console.log('日期:', r.taskDate.toISOString().split('T')[0], '完成:', r.completedWords + '/' + r.totalWords);
  });

  // 掌握度
  const masteries = await prisma.word_masteries.findMany({
    where: { studentId, isMastered: true }
  });
  console.log('\n=== 已掌握单词 ===');
  console.log('数量:', masteries.length);

  // study_plans统计
  const plans = await prisma.study_plans.findMany({
    where: { studentId }
  });
  const statusCount = {};
  plans.forEach(p => {
    statusCount[p.status] = (statusCount[p.status] || 0) + 1;
  });
  console.log('\n=== 学习计划状态 ===');
  Object.entries(statusCount).forEach(([k, v]) => console.log(k + ':', v));
}

verify().catch(console.error).finally(() => prisma.$disconnect());
