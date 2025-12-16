const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.students.findFirst({
    where: { student_no: '10012' }
  });
  console.log('学生ID:', student?.id);

  if (!student) return;

  // 查询所有日期的daily_tasks，按日期分组
  const allTasks = await prisma.daily_tasks.findMany({
    where: { studentId: student.id },
    orderBy: { taskDate: 'asc' }
  });

  const tasksByDate = {};
  allTasks.forEach(t => {
    const date = t.taskDate.toISOString().slice(0,10);
    if (!tasksByDate[date]) tasksByDate[date] = { total: 0, completed: 0, pending: 0 };
    tasksByDate[date].total++;
    if (t.status === 'COMPLETED') tasksByDate[date].completed++;
    else tasksByDate[date].pending++;
  });

  console.log('\ndaily_tasks 按日期分组:');
  Object.entries(tasksByDate).forEach(([date, stats]) => {
    console.log(date, '总:', stats.total, '完成:', stats.completed, '待完成:', stats.pending);
  });

  // 查询study_plans的nextReviewAt分布
  const plans = await prisma.study_plans.findMany({
    where: { studentId: student.id }
  });

  const plansByNextReview = {};
  plans.forEach(p => {
    const date = p.nextReviewAt?.toISOString().slice(0,10) || 'null';
    if (!plansByNextReview[date]) plansByNextReview[date] = 0;
    plansByNextReview[date]++;
  });

  console.log('\nstudy_plans.nextReviewAt 分布:');
  Object.entries(plansByNextReview).sort().forEach(([date, count]) => {
    console.log(date, count);
  });

  // 检查2025-12-16的答题记录对应的vocabularyId
  const answers = await prisma.question_answers.findMany({
    where: {
      studentId: student.id,
      answeredAt: {
        gte: new Date('2025-12-16T00:00:00'),
        lt: new Date('2025-12-17T00:00:00')
      }
    }
  });

  const vocabIds = [...new Set(answers.map(a => a.vocabularyId))];
  console.log('\n2025-12-16答题的vocabularyId:', vocabIds.length, '个');

  // 检查这些词汇在daily_tasks中的状态
  const tasksForVocabs = await prisma.daily_tasks.findMany({
    where: {
      studentId: student.id,
      vocabularyId: { in: vocabIds }
    }
  });

  console.log('\n这些词汇的daily_tasks:');
  tasksForVocabs.forEach(t => {
    console.log(t.taskDate.toISOString().slice(0,10), t.status.padEnd(12), t.vocabularyId.slice(0,20));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
