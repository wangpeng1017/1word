const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phones = ['13099990003', '13099990004'];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  console.log(`\n查询日期: ${tomorrowStr} (明天)`);
  console.log('='.repeat(60));

  for (const phone of phones) {
    console.log(`\n📱 手机号: ${phone}`);
    console.log('-'.repeat(60));

    // 1. 查找用户
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      console.log('❌ 用户不存在');
      continue;
    }

    console.log(`✅ 找到用户: ${user.name} (ID: ${user.id})`);

    // 2. 查找学生
    const student = await prisma.students.findUnique({
      where: { user_id: user.id },
      include: {
        classes: true
      }
    });

    if (!student) {
      console.log('❌ 学生信息不存在');
      continue;
    }

    console.log(`✅ 找到学生: 学号 ${student.student_no}, 班级: ${student.classes?.name || '未分配'}`);

    // 3. 查询明天的每日任务
    const dailyTasks = await prisma.daily_tasks.findMany({
      where: {
        studentId: student.id,
        taskDate: tomorrow
      }
    });

    console.log(`\n📚 明天学习任务统计:`);
    console.log(`  - 总任务数: ${dailyTasks.length} 个单词`);

    // 按状态分组
    const statusCount = {
      PENDING: dailyTasks.filter(t => t.status === 'PENDING').length,
      IN_PROGRESS: dailyTasks.filter(t => t.status === 'IN_PROGRESS').length,
      COMPLETED: dailyTasks.filter(t => t.status === 'COMPLETED').length,
      INTERRUPTED: dailyTasks.filter(t => t.status === 'INTERRUPTED').length
    };

    console.log(`  - 待学习: ${statusCount.PENDING} 个`);
    console.log(`  - 进行中: ${statusCount.IN_PROGRESS} 个`);
    console.log(`  - 已完成: ${statusCount.COMPLETED} 个`);
    console.log(`  - 已中断: ${statusCount.INTERRUPTED} 个`);

    // 4. 查询学习计划（复习任务）
    const studyPlans = await prisma.study_plans.findMany({
      where: {
        studentId: student.id,
        status: 'LEARNING',
        nextReviewAt: {
          gte: new Date(tomorrowStr + 'T00:00:00.000Z'),
          lt: new Date(tomorrowStr + 'T23:59:59.999Z')
        }
      }
    });

    console.log(`\n📅 明天复习任务统计:`);
    console.log(`  - 需要复习的单词: ${studyPlans.length} 个`);

    // 总计
    const totalWords = dailyTasks.length + studyPlans.length;
    console.log(`\n🎯 明天需要学习的单词总数: ${totalWords} 个`);
    console.log('='.repeat(60));
  }

  await prisma.$disconnect();
}

main()
  .catch(console.error);
