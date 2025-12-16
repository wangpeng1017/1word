const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 找到学生
  const student = await prisma.students.findFirst({
    where: { student_no: '10012' }
  });
  console.log('学生:', student?.id, student?.student_no);

  if (!student) return;

  // 查询今日任务
  const today = new Date('2025-12-16');
  today.setHours(0,0,0,0);

  const tasks = await prisma.daily_tasks.findMany({
    where: { studentId: student.id, taskDate: today },
    orderBy: { createdAt: 'desc' },
    take: 30
  });

  console.log('\n今日任务数量:', tasks.length);
  console.log('状态统计:');
  const statusCount = {};
  tasks.forEach(t => {
    statusCount[t.status] = (statusCount[t.status] || 0) + 1;
  });
  console.log(statusCount);

  console.log('\n任务详情(前15条):');
  tasks.slice(0, 15).forEach(t => {
    console.log(t.id.slice(0,25), t.status.padEnd(12), t.completedAt ? t.completedAt.toISOString().slice(11,19) : '未完成');
  });

  // 查询学习记录
  const records = await prisma.study_records.findMany({
    where: { studentId: student.id, taskDate: today }
  });
  console.log('\n学习记录数量:', records.length);
  records.forEach(r => {
    console.log('记录:', r.id.slice(0,25), '完成:', r.completedWords, '正确:', r.correctCount, '时间:', r.completedAt?.toISOString().slice(11,19));
  });

  // 查询答题记录
  const answers = await prisma.question_answers.findMany({
    where: { studentId: student.id },
    orderBy: { answeredAt: 'desc' },
    take: 15
  });
  console.log('\n最近答题记录:', answers.length);
  answers.forEach(a => {
    console.log(a.answeredAt.toISOString().slice(0,19), a.isCorrect ? '对' : '错', a.vocabularyId.slice(0,20));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
