/**
 * 验证测试数据完整性
 * 
 * 检查所有测试数据是否正确创建：
 * - 教师账号
 * - 班级
 * - 学生账号
 * - 词汇和题目
 * - 学习计划
 * - 今日任务
 * 
 * 使用方法：
 * node scripts/verify-test-data.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  console.log('========================================');
  console.log('开始验证测试数据...');
  console.log('========================================\n');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    // 1. 验证教师账号
    console.log('📋 验证教师账号...');
    const teacher = await prisma.teacher.findFirst({
      include: {
        user: true
      },
      where: {
        user: {
          email: 'teacher@test.com'
        }
      }
    });

    if (teacher) {
      console.log(`✅ 教师账号存在: ${teacher.user.name} (${teacher.user.email})`);
      results.passed.push('教师账号');
    } else {
      console.log('❌ 教师账号不存在');
      results.failed.push('教师账号');
    }

    // 2. 验证班级
    console.log('\n📋 验证班级...');
    const testClass = await prisma.class.findFirst({
      where: {
        name: '测试班级（高三1班）'
      }
    });

    if (testClass) {
      console.log(`✅ 班级存在: ${testClass.name}`);
      results.passed.push('班级');
    } else {
      console.log('❌ 班级不存在');
      results.failed.push('班级');
    }

    // 3. 验证学生账号
    console.log('\n📋 验证学生账号...');
    const students = await prisma.student.findMany({
      where: {
        studentNo: {
          in: ['2025001', '2025002', '2025003']
        }
      },
      include: {
        user: true,
        class: true
      }
    });

    if (students.length === 3) {
      console.log(`✅ 学生账号完整 (${students.length}个):`);
      students.forEach(s => {
        console.log(`   - ${s.user.name} (${s.studentNo}) - ${s.class.name}`);
      });
      results.passed.push('学生账号');
    } else {
      console.log(`❌ 学生账号不完整 (预期3个，实际${students.length}个)`);
      results.failed.push('学生账号');
    }

    // 4. 验证词汇
    console.log('\n📋 验证词汇...');
    const vocabularies = await prisma.vocabulary.findMany({
      where: {
        word: {
          in: ['apple', 'book', 'cat', 'dog', 'egg', 'fish', 'good', 'happy', 'ice', 'jump',
               'kind', 'love', 'moon', 'nice', 'pen', 'run', 'sun', 'tree', 'water', 'yellow']
        }
      }
    });

    if (vocabularies.length === 20) {
      console.log(`✅ 词汇完整 (${vocabularies.length}个)`);
      results.passed.push('词汇');
    } else {
      console.log(`⚠️  词汇不完整 (预期20个，实际${vocabularies.length}个)`);
      results.warnings.push(`词汇数量: ${vocabularies.length}/20`);
    }

    // 5. 验证题目
    console.log('\n📋 验证题目...');
    const questions = await prisma.question.findMany({
      where: {
        vocabularyId: {
          in: vocabularies.map(v => v.id)
        }
      },
      include: {
        options: true
      }
    });

    const expectedQuestionCount = vocabularies.length * 4;
    if (questions.length === expectedQuestionCount) {
      console.log(`✅ 题目完整 (${questions.length}个 = ${vocabularies.length}词 × 4题型)`);
      
      // 检查题型分布
      const typeCount = {
        ENGLISH_TO_CHINESE: 0,
        CHINESE_TO_ENGLISH: 0,
        LISTENING: 0,
        FILL_IN_BLANK: 0
      };
      questions.forEach(q => {
        typeCount[q.type]++;
      });
      
      console.log('   题型分布:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}个`);
      });
      
      results.passed.push('题目');
    } else {
      console.log(`❌ 题目不完整 (预期${expectedQuestionCount}个，实际${questions.length}个)`);
      results.failed.push('题目');
    }

    // 6. 验证选项
    console.log('\n📋 验证题目选项...');
    let optionsValid = true;
    for (const question of questions) {
      if (question.options.length !== 4) {
        console.log(`❌ 题目 ${question.id} 选项数量错误: ${question.options.length}个`);
        optionsValid = false;
      }
      const correctOptions = question.options.filter(o => o.isCorrect);
      if (correctOptions.length !== 1) {
        console.log(`❌ 题目 ${question.id} 正确答案数量错误: ${correctOptions.length}个`);
        optionsValid = false;
      }
    }

    if (optionsValid) {
      console.log(`✅ 所有题目选项正确 (每题4个选项，1个正确答案)`);
      results.passed.push('题目选项');
    } else {
      results.failed.push('题目选项');
    }

    // 7. 验证学习计划
    console.log('\n📋 验证学习计划...');
    const studyPlans = await prisma.studyPlan.findMany({
      where: {
        studentId: {
          in: students.map(s => s.id)
        }
      }
    });

    const expectedPlanCount = students.length * vocabularies.length;
    if (studyPlans.length === expectedPlanCount) {
      console.log(`✅ 学习计划完整 (${studyPlans.length}个 = ${students.length}学生 × ${vocabularies.length}词)`);
      results.passed.push('学习计划');
    } else {
      console.log(`⚠️  学习计划不完整 (预期${expectedPlanCount}个，实际${studyPlans.length}个)`);
      results.warnings.push(`学习计划: ${studyPlans.length}/${expectedPlanCount}`);
    }

    // 8. 验证今日任务
    console.log('\n📋 验证今日任务...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyTasks = await prisma.dailyTask.findMany({
      where: {
        studentId: {
          in: students.map(s => s.id)
        },
        taskDate: today
      }
    });

    const expectedTaskCount = students.length * 10; // 每个学生10个任务
    if (dailyTasks.length === expectedTaskCount) {
      console.log(`✅ 今日任务完整 (${dailyTasks.length}个 = ${students.length}学生 × 10任务)`);
      results.passed.push('今日任务');
    } else {
      console.log(`⚠️  今日任务不完整 (预期${expectedTaskCount}个，实际${dailyTasks.length}个)`);
      results.warnings.push(`今日任务: ${dailyTasks.length}/${expectedTaskCount}`);
    }

    // 9. 验证数据关联
    console.log('\n📋 验证数据关联...');
    
    // 检查学生是否都在同一个班级
    const classIds = new Set(students.map(s => s.classId));
    if (classIds.size === 1) {
      console.log('✅ 所有学生在同一个班级');
      results.passed.push('学生班级关联');
    } else {
      console.log('❌ 学生分散在多个班级');
      results.failed.push('学生班级关联');
    }

    // 检查班级是否属于教师
    if (testClass && teacher && testClass.teacherId === teacher.id) {
      console.log('✅ 班级属于测试教师');
      results.passed.push('班级教师关联');
    } else {
      console.log('❌ 班级教师关联错误');
      results.failed.push('班级教师关联');
    }

    // 总结
    console.log('\n========================================');
    console.log('验证结果汇总');
    console.log('========================================\n');

    console.log(`✅ 通过检查: ${results.passed.length}项`);
    results.passed.forEach(item => console.log(`   - ${item}`));

    if (results.warnings.length > 0) {
      console.log(`\n⚠️  警告: ${results.warnings.length}项`);
      results.warnings.forEach(item => console.log(`   - ${item}`));
    }

    if (results.failed.length > 0) {
      console.log(`\n❌ 失败: ${results.failed.length}项`);
      results.failed.forEach(item => console.log(`   - ${item}`));
    }

    console.log('\n========================================');
    if (results.failed.length === 0) {
      console.log('🎉 所有测试数据验证通过！');
      console.log('可以开始在小程序中进行测试了。');
    } else {
      console.log('⚠️  存在验证失败项，请重新运行初始化脚本。');
    }
    console.log('========================================\n');

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
