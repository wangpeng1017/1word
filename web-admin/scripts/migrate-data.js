/**
 * @file migrate-data.js
 * @desc 从 Vercel 数据库迁移数据到阿里云
 */
const { PrismaClient } = require('@prisma/client');

const SOURCE_URL = "postgres://70b463f0b437de031fed82ef1e60a31c4764574b5b85f2971518520d47db953d:sk_ppgr1YQhsciDLwChczX1t@db.prisma.io:5432/postgres?sslmode=require";
const TARGET_URL = "postgresql://word_user:word_pass_2024@47.92.96.143:5432/word_app";

async function migrate() {
  console.log('连接源数据库...');
  const sourceDb = new PrismaClient({ datasources: { db: { url: SOURCE_URL } } });
  const targetDb = new PrismaClient({ datasources: { db: { url: TARGET_URL } } });

  try {
    // 测试连接
    await sourceDb.$connect();
    console.log('源数据库连接成功！\n');
  } catch (e) {
    console.log('源数据库连接失败:', e.message);
    process.exit(1);
  }

  const tables = [
    'user', 'teachers', 'classes', 'students', 'vocabularies', 'word_meanings',
    'word_images', 'word_audios', 'questions', 'question_options', 'vocabulary_packs',
    'vocabulary_pack_days', 'vocabulary_pack_day_words', 'plan_classes', 'study_plans',
    'daily_tasks', 'study_records', 'proficiency_tests', 'test_records', 'word_masteries',
    'wrong_questions', 'question_answers', 'student_points', 'point_history',
    'achievements', 'student_achievements', 'study_streaks', 'system_configs', 'operation_logs'
  ];

  console.log('开始迁移数据...\n');

  for (const table of tables) {
    try {
      const data = await sourceDb[table].findMany();
      if (data.length === 0) {
        console.log(`${table}: 0 条记录，跳过`);
        continue;
      }

      await targetDb[table].deleteMany();
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await targetDb[table].createMany({ data: batch, skipDuplicates: true });
      }
      console.log(`${table}: ${data.length} 条记录已迁移`);
    } catch (e) {
      console.log(`${table}: 错误 - ${e.message.split('\n')[0]}`);
    }
  }

  console.log('\n迁移完成！');
  await sourceDb.$disconnect();
  await targetDb.$disconnect();
}

migrate().catch(console.error);
