/**
 * 修复 daily_tasks 状态未更新的问题
 * 根据 question_answers 记录，将已答题的 daily_tasks 标记为 COMPLETED
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('开始修复 daily_tasks 状态...\n');

  // 查找所有有答题记录但 daily_tasks 状态为 PENDING 的情况
  const pendingTasks = await prisma.daily_tasks.findMany({
    where: { status: 'PENDING' },
    select: { id: true, studentId: true, vocabularyId: true, taskDate: true }
  });

  console.log(`找到 ${pendingTasks.length} 个 PENDING 状态的任务`);

  let fixedCount = 0;

  for (const task of pendingTasks) {
    // 检查该学生在该日期是否有该词汇的答题记录
    const taskDateStart = new Date(task.taskDate);
    taskDateStart.setHours(0, 0, 0, 0);
    const taskDateEnd = new Date(task.taskDate);
    taskDateEnd.setHours(23, 59, 59, 999);

    const answer = await prisma.question_answers.findFirst({
      where: {
        studentId: task.studentId,
        vocabularyId: task.vocabularyId,
        answeredAt: { gte: taskDateStart, lte: taskDateEnd }
      }
    });

    if (answer) {
      // 有答题记录，更新状态为 COMPLETED
      await prisma.daily_tasks.update({
        where: { id: task.id },
        data: {
          status: 'COMPLETED',
          completedAt: answer.answeredAt,
          updatedAt: new Date()
        }
      });
      fixedCount++;
      console.log(`修复: ${task.id.slice(0, 20)} -> COMPLETED (${task.taskDate.toISOString().slice(0, 10)})`);
    }
  }

  console.log(`\n修复完成，共修复 ${fixedCount} 个任务`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
