const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.students.findFirst({
    where: { student_no: '10012' }
  });
  console.log('学生ID:', student?.id);

  if (!student) return;

  // 查询所有日期的daily_tasks
  const allTasks = await prisma.daily_tasks.findMany({
    where: { studentId: student.id },
    orderBy: { taskDate: 'desc' },
    take: 20
  });
  console.log('\n所有daily_tasks数量:', allTasks.length);
  allTasks.forEach(t => {
    console.log(t.taskDate.toISOString().slice(0,10), t.status.padEnd(12), t.vocabularyId.slice(0,20));
  });

  // 查询study_plans
  const plans = await prisma.study_plans.findMany({
    where: { studentId: student.id },
    take: 15
  });
  console.log('\n学习计划数量:', plans.length);
  plans.slice(0,5).forEach(p => {
    console.log(p.status.padEnd(12), p.reviewCount, p.nextReviewAt?.toISOString().slice(0,10), p.vocabularyId.slice(0,20));
  });

  // 查询所有study_records
  const allRecords = await prisma.study_records.findMany({
    where: { studentId: student.id },
    orderBy: { taskDate: 'desc' },
    take: 10
  });
  console.log('\n所有学习记录:', allRecords.length);
  allRecords.forEach(r => {
    console.log(r.taskDate.toISOString().slice(0,10), '完成:', r.completedWords, '正确:', r.correctCount);
  });

  // 检查答题记录对应的vocabularyId是否在study_plans中
  const answers = await prisma.question_answers.findMany({
    where: { studentId: student.id },
    orderBy: { answeredAt: 'desc' },
    take: 10
  });

  const vocabIds = [...new Set(answers.map(a => a.vocabularyId))];
  console.log('\n答题涉及的vocabularyId:', vocabIds.length);

  const matchingPlans = await prisma.study_plans.findMany({
    where: { studentId: student.id, vocabularyId: { in: vocabIds } }
  });
  console.log('匹配的study_plans数量:', matchingPlans.length);

  // 检查这些词汇是否有daily_tasks
  const matchingTasks = await prisma.daily_tasks.findMany({
    where: { studentId: student.id, vocabularyId: { in: vocabIds } }
  });
  console.log('匹配的daily_tasks数量:', matchingTasks.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
