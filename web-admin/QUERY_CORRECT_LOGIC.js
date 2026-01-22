const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phones = ['13099990003', '13099990004'];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  console.log('\n' + '='.repeat(70));
  console.log('学生学习单词统计 - ' + tomorrowStr + ' (明天)');
  console.log('计算公式: 学习单词数 = 计划 + 复习 - 掌握');
  console.log('='.repeat(70));

  for (const phone of phones) {
    console.log('\n📱 手机号: ' + phone);
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

    console.log('学生: ' + user.name + ' (学号: ' + student.student_no + ')');

    // 2. 计划：查询班级学习计划中的所有单词（整个词汇库）
    const planClasses = await prisma.plan_classes.findMany({
      where: {
        class_id: student.class_id,
        status: 'ACTIVE'
      },
      include: {
        vocabulary_packs: true
      }
    });

    let planWordsCount = 0;
    for (const planClass of planClasses) {
      planWordsCount += planClass.vocabulary_packs.totalWords;
      console.log('\n📘 学习计划: ' + planClass.vocabulary_packs.name);
      console.log('   计划单词数: ' + planClass.vocabulary_packs.totalWords + ' 个');
    }

    // 3. 复习：查询所有需要复习的单词（状态为LEARNING的study_plans）
    const reviewPlans = await prisma.study_plans.findMany({
      where: {
        studentId: student.id,
        status: 'LEARNING'
      }
    });
    const reviewCount = reviewPlans.length;

    // 4. 掌握：查询已掌握的单词
    const masteredCount = await prisma.word_masteries.count({
      where: {
        studentId: student.id,
        isMastered: true
      }
    });

    // 5. 明天新学的单词
    let newWordsTomorrow = 0;
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
          newWordsTomorrow += packDay.wordCount;
        }
      }
    }

    // 6. 明天需要复习的单词
    const reviewTomorrow = await prisma.study_plans.findMany({
      where: {
        studentId: student.id,
        status: 'LEARNING',
        nextReviewAt: {
          gte: new Date(tomorrowStr + 'T00:00:00.000Z'),
          lt: new Date(tomorrowStr + 'T23:59:59.999Z')
        }
      }
    });

    console.log('\n📊 学习单词统计:');
    console.log('   ➕ 计划: ' + planWordsCount + ' 个');
    console.log('   ➕ 复习: ' + reviewCount + ' 个');
    console.log('   ➖ 掌握: ' + masteredCount + ' 个');
    console.log('   ➗ 已复习但未掌握: ' + reviewCount - masteredCount + ' 个');
    console.log('\n🎯 学习单词数 = 计划(' + planWordsCount + ') + 复习(' + reviewCount + ') - 掌握(' + masteredCount + ')');
    console.log('   = ' + planWordsCount + reviewCount - masteredCount + ' 个');

    console.log('\n📅 明天具体任务:');
    console.log('   ✨ 新学: ' + newWordsTomorrow + ' 个');
    console.log('   🔄 复习: ' + reviewTomorrow.length + ' 个');
    console.log('   🎯 明天总计: ' + newWordsTomorrow + reviewTomorrow.length + ' 个');

    console.log('='.repeat(70));
  }

  // 汇总
  console.log('\n' + '🔥'.repeat(35));
  console.log('📋 两个学生汇总');
  console.log('🔥'.repeat(35));

  let totalPlan = 0;
  let totalReview = 0;
  let totalMastered = 0;
  let totalNewTomorrow = 0;
  let totalReviewTomorrow = 0;

  for (const phone of phones) {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) continue;

    const student = await prisma.students.findUnique({
      where: { user_id: user.id }
    });
    if (!student) continue;

    // 计划
    const planClasses = await prisma.plan_classes.findMany({
      where: { class_id: student.class_id, status: 'ACTIVE' },
      include: { vocabulary_packs: true }
    });
    for (const planClass of planClasses) {
      totalPlan += planClass.vocabulary_packs.totalWords;
    }

    // 复习
    const review = await prisma.study_plans.count({
      where: { studentId: student.id, status: 'LEARNING' }
    });
    totalReview += review;

    // 掌握
    const mastered = await prisma.word_masteries.count({
      where: { studentId: student.id, isMastered: true }
    });
    totalMastered += mastered;

    // 明天新学
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
        if (packDay) totalNewTomorrow += packDay.wordCount;
      }
    }

    // 明天复习
    const reviewTom = await prisma.study_plans.findMany({
      where: {
        studentId: student.id,
        status: 'LEARNING',
        nextReviewAt: {
          gte: new Date(tomorrowStr + 'T00:00:00.000Z'),
          lt: new Date(tomorrowStr + 'T23:59:59.999Z')
        }
      }
    });
    totalReviewTomorrow += reviewTom.length;
  }

  console.log('\n📊 学习单词统计 (两个学生合计):');
  console.log('   ➕ 计划: ' + totalPlan + ' 个');
  console.log('   ➕ 复习: ' + totalReview + ' 个');
  console.log('   ➖ 掌握: ' + totalMastered + ' 个');
  console.log('\n🎯 学习单词数 = ' + totalPlan + ' + ' + totalReview + ' - ' + totalMastered + ' = ' + (totalPlan + totalReview - totalMastered) + ' 个');

  console.log('\n📅 明天具体任务 (两个学生合计):');
  console.log('   ✨ 新学: ' + totalNewTomorrow + ' 个');
  console.log('   🔄 复习: ' + totalReviewTomorrow + ' 个');
  console.log('   🎯 明天总计: ' + totalNewTomorrow + totalReviewTomorrow + ' 个');

  console.log('\n' + '='.repeat(70));

  await prisma.$disconnect();
}

main()
  .catch(console.error);
