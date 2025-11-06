/**
 * 验证当前数据库中的测试数据完整性
 * 
 * 使用方法：
 * node scripts/verify-current-data.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  console.log('========================================');
  console.log('验证当前测试数据...');
  console.log('========================================\n');

  const results = {
    passed: [],
    warnings: []
  };

  try {
    // 1. 统计数据
    console.log('📊 数据统计：\n');
    
    const teacherCount = await prisma.teacher.count();
    console.log(`👨‍🏫 教师: ${teacherCount}个`);
    
    const classCount = await prisma.class.count();
    console.log(`🏫 班级: ${classCount}个`);
    
    const studentCount = await prisma.student.count();
    console.log(`👨‍🎓 学生: ${studentCount}个`);
    
    const vocabularyCount = await prisma.vocabulary.count();
    console.log(`📚 词汇: ${vocabularyCount}个`);
    
    const questionCount = await prisma.question.count();
    console.log(`❓ 题目: ${questionCount}个`);
    
    const studyPlanCount = await prisma.studyPlan.count();
    console.log(`📝 学习计划: ${studyPlanCount}个`);
    
    const dailyTaskCount = await prisma.dailyTask.count();
    console.log(`✅ 今日任务: ${dailyTaskCount}个\n`);

    // 2. 检查词汇和题目比例
    console.log('📋 检查数据完整性...\n');
    
    if (vocabularyCount > 0) {
      const expectedQuestions = vocabularyCount * 4;
      if (questionCount === expectedQuestions) {
        console.log(`✅ 题目数量正确 (${questionCount}个 = ${vocabularyCount}词 × 4题型)`);
        results.passed.push('题目数量');
      } else {
        console.log(`⚠️  题目数量不匹配 (预期${expectedQuestions}个，实际${questionCount}个)`);
        results.warnings.push(`题目数量: ${questionCount}/${expectedQuestions}`);
      }
    }

    // 3. 检查题型分布
    const questionsByType = await prisma.question.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    });

    console.log('\n题型分布:');
    questionsByType.forEach(item => {
      console.log(`   - ${item.type}: ${item._count.type}个`);
    });

    // 4. 检查学习计划
    if (studentCount > 0 && vocabularyCount > 0) {
      const expectedPlans = studentCount * vocabularyCount;
      if (studyPlanCount === expectedPlans) {
        console.log(`\n✅ 学习计划数量正确 (${studyPlanCount}个 = ${studentCount}学生 × ${vocabularyCount}词)`);
        results.passed.push('学习计划数量');
      } else {
        console.log(`\n⚠️  学习计划数量不匹配 (预期${expectedPlans}个，实际${studyPlanCount}个)`);
        results.warnings.push(`学习计划: ${studyPlanCount}/${expectedPlans}`);
      }
    }

    // 5. 检查今日任务
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = await prisma.dailyTask.count({
      where: { taskDate: today }
    });
    
    console.log(`✅ 今日任务: ${todayTasks}个`);

    // 6. 显示前10个词汇
    console.log('\n📚 词汇列表（前10个）:');
    const vocabularies = await prisma.vocabulary.findMany({
      take: 10,
      orderBy: { createdAt: 'asc' }
    });
    
    vocabularies.forEach((v, idx) => {
      console.log(`   ${idx + 1}. ${v.word} - ${v.primaryMeaning} ${v.phonetic || ''}`);
    });
    
    if (vocabularyCount > 10) {
      console.log(`   ... 还有 ${vocabularyCount - 10} 个词汇`);
    }

    // 7. 检查选项完整性
    console.log('\n📋 检查题目选项...');
    const questionsWithOptions = await prisma.question.findMany({
      include: {
        options: true
      },
      take: 5
    });

    let optionsValid = true;
    for (const q of questionsWithOptions) {
      if (q.options.length !== 4) {
        console.log(`❌ 题目选项错误: ${q.id} 有 ${q.options.length} 个选项`);
        optionsValid = false;
      }
      const correctCount = q.options.filter(o => o.isCorrect).length;
      if (correctCount !== 1) {
        console.log(`❌ 正确答案错误: ${q.id} 有 ${correctCount} 个正确答案`);
        optionsValid = false;
      }
    }

    if (optionsValid) {
      console.log('✅ 题目选项格式正确 (抽查通过)');
      results.passed.push('题目选项');
    }

    // 8. 显示测试账号
    console.log('\n🔑 测试账号:');
    const teacherUser = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    });
    if (teacherUser) {
      console.log(`   教师: ${teacherUser.email || teacherUser.name} / 密码: 123456`);
    }

    const students = await prisma.student.findMany({
      include: { user: true },
      take: 5
    });
    console.log('   学生:');
    students.forEach(s => {
      console.log(`   - ${s.studentNo} (${s.user.name}) / 密码: 123456`);
    });

    // 总结
    console.log('\n========================================');
    console.log('验证完成');
    console.log('========================================\n');

    if (vocabularyCount === 0) {
      console.log('⚠️  数据库中没有词汇数据');
      console.log('请运行: node scripts/init-from-testword.js');
    } else {
      console.log(`✅ 数据库包含 ${vocabularyCount} 个词汇和 ${questionCount} 个题目`);
      console.log('可以开始在小程序中进行测试！');
    }

  } catch (error) {
    console.error('\n❌ 验证过程出错:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('执行出错:', error);
    process.exit(1);
  });
