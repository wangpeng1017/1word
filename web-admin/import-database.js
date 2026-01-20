const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  console.log('开始导入数据...');

  try {
    // 读取导出的数据
    const data = JSON.parse(fs.readFileSync('database-export.json', 'utf8'));

    // 按依赖顺序导入表
    const importOrder = [
      'user',
      'teachers',
      'classes',
      'students',
      'vocabularies',
      'word_meanings',
      'word_audios',
      'word_images',
      'questions',
      'question_options',
      'study_plans',
      'plan_classes',
      'daily_tasks',
      'study_records',
      'proficiency_tests',
      'test_records',
      'word_masteries',
      'wrong_questions',
      'system_configs',
      'student_points',
      'point_history',
      'achievements',
      'student_achievements',
      'study_streaks',
      // 新增的表
      'operation_logs',
      'question_answers',
      'vocabulary_packs',
      'vocabulary_pack_days',
      'vocabulary_pack_day_words',
      'badges',
      'student_badges',
      'redeemable_achievements',
      'achievement_redemptions'
    ];

    for (const table of importOrder) {
      const records = data[table] || [];
      if (records.length === 0) {
        console.log(`⊘ 跳过 ${table}: 无数据`);
        continue;
      }

      try {
        // 使用createMany批量插入
        await prisma[table].createMany({
          data: records,
          skipDuplicates: true
        });
        console.log(`✓ 导入 ${table}: ${records.length} 条记录`);
      } catch (error) {
        console.log(`✗ 导入 ${table} 失败: ${error.message}`);
      }
    }

    console.log('\n数据导入完成！');

  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
