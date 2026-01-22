const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phones = ['13099990003', '13099990004'];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  console.log(`\n查询日期: ${tomorrowStr} (明天)`);
  console.log('='.repeat(70));

  for (const phone of phones) {
    console.log(`\n📱 手机号: ${phone}`);
    console.log('-'.repeat(70));

    // 1. 查找用户
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      console.log('❌ 用户不存在');
      continue;
    }

    // 2. 查找学生及其班级
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

    const classId = student.class_id;
    const className = student.classes?.name || '未分配';
    console.log(`✅ 学生: ${user.name} (学号: ${student.student_no})`);
    console.log(`✅ 班级: ${className} (ID: ${classId})`);

    // 3. 查询班级的学习计划
    const planClasses = await prisma.plan_classes.findMany({
      where: {
        class_id: classId,
        status: 'ACTIVE'
      },
      include: {
        vocabulary_packs: true
      }
    });

    if (planClasses.length === 0) {
      console.log('❌ 没有找到活跃的班级学习计划');
      continue;
    }

    console.log(`\n📚 找到 ${planClasses.length} 个学习计划:\n`);

    for (const planClass of planClasses) {
      const pack = planClass.vocabulary_packs;
      console.log(`  📖 词汇库: ${pack.name} (共${pack.totalDays}天, ${pack.totalWords}词)`);

      // 计算明天是第几天
      const startDate = new Date(planClass.start_date);
      startDate.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((tomorrow - startDate) / (1000 * 60 * 60 * 24));

      if (dayDiff < 0) {
        console.log(`     ⏰ 计划尚未开始 (开始日期: ${startDate.toISOString().split('T')[0]})`);
        continue;
      }

      if (dayDiff >= pack.totalDays) {
        console.log(`     ✅ 计划已结束 (应于${pack.totalDays}天完成)`);
        continue;
      }

      const dayNumber = dayDiff + 1;
      console.log(`     📅 明天是第 ${dayNumber} 天`);

      // 查询那一天的单词数量
      const packDay = await prisma.vocabulary_pack_days.findUnique({
        where: {
          packId_dayNumber: {
            packId: planClass.pack_id,
            dayNumber: dayNumber
          }
        }
      });

      if (packDay) {
        console.log(`     🎯 明天需要学习: ${packDay.wordCount} 个单词`);
        console.log(`     📝 标题: ${packDay.title || '无标题'}`);
      } else {
        console.log(`     ❌ 未找到第${dayNumber}天的学习内容`);
      }

      console.log('');
    }

    console.log('='.repeat(70));
  }

  await prisma.$disconnect();
}

main()
  .catch(console.error);
