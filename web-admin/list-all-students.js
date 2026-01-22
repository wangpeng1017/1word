const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('查询所有学生用户信息...\n');

  // 查询所有学生
  const students = await prisma.students.findMany({
    include: {
      user: true,
      classes: true
    }
  });

  console.log(`找到 ${students.length} 个学生\n`);
  console.log('='.repeat(80));

  for (const student of students) {
    console.log(`\n👤 学生信息:`);
    console.log(`  - 学号: ${student.student_no}`);
    console.log(`  - 姓名: ${student.user.name}`);
    console.log(`  - 手机号: ${student.user.phone || '未设置'}`);
    console.log(`  - 班级: ${student.classes?.name || '未分配'}`);
    console.log(`  - 微信ID: ${student.wechat_id || '未绑定'}`);

    // 查询明天的任务
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dailyTasks = await prisma.daily_tasks.count({
      where: {
        studentId: student.id,
        taskDate: tomorrow
      }
    });

    // 查询明天的复习任务
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const studyPlans = await prisma.study_plans.count({
      where: {
        studentId: student.id,
        status: 'LEARNING',
        nextReviewAt: {
          gte: new Date(tomorrowStr + 'T00:00:00.000Z'),
          lt: new Date(tomorrowStr + 'T23:59:59.999Z')
        }
      }
    });

    const totalWords = dailyTasks + studyPlans;
    console.log(`  - 明天(1月7日)学习任务: ${totalWords} 个单词`);
    console.log(`    (新学: ${dailyTasks} | 复习: ${studyPlans})`);

    console.log('-'.repeat(80));
  }

  await prisma.$disconnect();
}

main()
  .catch(console.error);
