const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function exportData() {
  console.log('开始导出数据...');

  try {
    // 导出所有表的数据
    const tables = [
      'user',
      'teachers',
      'students',
      'classes',
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
      'test_records',
      'proficiency_tests',
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

    const data = {};

    for (const table of tables) {
      try {
        const records = await prisma[table].findMany();
        data[table] = records;
        console.log(`✓ 导出 ${table}: ${records.length} 条记录`);
      } catch (error) {
        console.log(`✗ 跳过 ${table}: ${error.message}`);
        data[table] = [];
      }
    }

    // 保存为JSON文件
    fs.writeFileSync('database-export.json', JSON.stringify(data, null, 2));
    console.log('\n数据已导出到 database-export.json');

    // 生成统计信息
    const stats = Object.entries(data).map(([table, records]) => ({
      table,
      count: records.length
    }));

    console.log('\n=== 导出统计 ===');
    stats.forEach(({ table, count }) => {
      if (count > 0) {
        console.log(`${table}: ${count} 条`);
      }
    });

  } catch (error) {
    console.error('导出失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
