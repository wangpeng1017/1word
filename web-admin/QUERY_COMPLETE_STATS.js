const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phones = ['13099990003', '13099990004'];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  console.log('\n' + '='.repeat(70));
  console.log(`📊 学生学习任务统计 - ${tomorrowStr} (明天)`);
  console.log('='.repeat(70));

  for (const phone of phones) {
    console.log(`\n📱 手机号: ${phone}`);
    console.log('-'.repeat(70));

    // 1. 查找用户和学生
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      console.log('❌ 用户不存在\n');
      continue;
    }

    const student = await prisma.students.findUnique({
      where: { user_id: user.id },
      include: {
        classes: true
      }
    });

    if (!student) {
      console.log('❌ 学生信息不存在\n');
      continue;
    }

    console.log(`学生: ${user.name} (学号: ${student.student_no})`);
    console.log(`班级: ${student.classes?.name || '未分配'}`);

    // 2. 查询班级学习计划 - 明天新学的单词
    const planClasses = await prisma.plan_classes.findMany({
      where: {
        class_id: student.class_id,
        status: 'ACTIVE'
      },
      include: {
        vocabulary_packs: true
      }
    });

    let newWordsCount = 0;
    for (const planClass of planClasses) {
      const startDate = new Date(planClass.start_date);
      startDate.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((tomorrow - startDate) / (1000 * 60 * 60 * 24));

      if (dayDiff >= 0 && dayDiff < planClass.vocabulary_packs.totalDays) {
        const dayNumber = dayDiff + 1;
        const packDay = await prisma.vocabulary_pack_days.findUnique({
          where: {
            packId_dayNumber: {
              packId: planClass.pack_id,
              dayNumber: dayNumber
            }
          }
        });
        if (packDay) {
          newWordsCount += packDay.wordCount;
        }
      }
    }

    // 3. 查询明天需要复习的单词（艾宾浩斯遗忘曲线）
    const reviewPlans = await prisma.study_plans.findMany({
      where: {
        studentId: student.id,
        status: 'LEARNING',
        nextReviewAt: {
          gte: new Date(tomorrowStr + 'T00:00:00.000Z'),
          lt: new Date(tomorrowStr + 'T23:59:59.999Z')
        }
      }
    });

    // 4. 查询已掌握的单词
    const masteredCount = await prisma.word_masteries.count({
      where: {
        studentId: student.id,
        isMastered: true
      }
    });

    // 5. 查询正在学习的单词总数
    const learningCount = await prisma.study_plans.count({
      where: {
        studentId: student.id,
        status: 'LEARNING'
      }
    });

    // 6. 查询困难单词
    const difficultCount = await prisma.word_masteries.count({
      where: {
        studentId: student.id,
        isDifficult: true
      }
    });

    const totalWords = newWordsCount + reviewPlans.length;

    console.log('\n📚 明天学习任务:');
    console.log(`  ✨ 新学单词: ${newWordsCount} 个`);
    console.log(`  🔄 复习单词: ${reviewPlans.length} 个`);
    console.log(`  🎯 总计需要学习: ${totalWords} 个`);

    console.log('\n📊 学习进度统计:');
    console.log(`  ✅ 已掌握: ${masteredCount} 个`);
    console.log(`  📖 正在学习: ${learningCount} 个`);
    console.log(`  ⚠️  困难单词: ${difficultCount} 个`);

    console.log('='.repeat(70));
  }

  // 汇总两个学生的数据
  console.log('\n' + '🔥'.repeat(35));
  console.log('📋 两个学生汇总 (2026-01-07)');
  console.log('🔥'.repeat(35));

  let totalNew = 0;
  let totalReview = 0;
  let totalMastered = 0;

  for (const phone of phones) {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) continue;

    const student = await prisma.students.findUnique({
      where: { user_id: user.id }
    });
    if (!student) continue;

    // 新学单词
    const planClasses = await prisma.plan_classes.findMany({
      where: { class_id: student.class_id, status: 'ACTIVE' },
      include: { vocabulary_packs: true }
    });

    for (const planClass of planClasses) {
      const startDate = new Date(planClass.start_date);
      startDate.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((tomorrow - startDate) / (1000 * 60 * 60 * 24));

      if (dayDiff >= 0 && dayDiff < planClass.vocabulary_packs.totalDays) {
        const dayNumber = dayDiff + 1;
        const packDay = await prisma.vocabulary_pack_days.findUnique({
          where: {
            packId_dayNumber: {
              packId: planClass.pack_id,
              dayNumber: dayNumber
            }
          }
        });
        if (packDay) totalNew += packDay.wordCount;
      }
    }

    // 复习单词
    const reviewPlans = await prisma.study_plans.findMany({
      where: {
        studentId: student.id,
        status: 'LEARNING',
        nextReviewAt: {
          gte: new Date(tomorrowStr + 'T00:00:00.000Z'),
          lt: new Date(tomorrowStr + 'T23:59:59.999Z')
        }
      }
    });
    totalReview += reviewPlans.length;

    // 已掌握
    const mastered = await prisma.word_masteries.count({
      where: {
        studentId: student.id,
        isMastered: true
      }
    });
    totalMastered += mastered;
  }

  console.log(`\n📖 两个学生明天需要学习的单词总数:`);
  console.log(`  - 新学单词: ${totalNew} 个`);
  console.log(`  - 复习单词: ${totalReview} 个`);
  console.log(`  - 🎯 总计: ${totalNew + totalReview} 个`);

  console.log(`\n✅ 两个学生已掌握的单词总数: ${totalMastered} 个`);
  console.log('\n' + '='.repeat(70));

  await prisma.$disconnect();
}

main()
  .catch(console.error);
