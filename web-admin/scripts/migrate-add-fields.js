/**
 * 数据库迁移脚本：添加听力题和填空题字段
 * 
 * 使用方法：
 * 1. 确保 .env 文件中配置了正确的 DATABASE_URL
 * 2. 运行: node scripts/migrate-add-fields.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  console.log('开始数据库迁移...\n');

  try {
    // 1. 添加 vocabularies.audio_url 字段
    console.log('1. 正在添加 vocabularies.audio_url 字段...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE vocabularies 
      ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);
    `);
    console.log('✅ vocabularies.audio_url 字段添加成功\n');

    // 2. 添加 questions.sentence 字段
    console.log('2. 正在添加 questions.sentence 字段...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE questions 
      ADD COLUMN IF NOT EXISTS sentence TEXT;
    `);
    console.log('✅ questions.sentence 字段添加成功\n');

    // 3. 添加字段注释
    console.log('3. 正在添加字段注释...');
    await prisma.$executeRawUnsafe(`
      COMMENT ON COLUMN vocabularies.audio_url IS '音频URL，用于听力题快速访问';
    `);
    await prisma.$executeRawUnsafe(`
      COMMENT ON COLUMN questions.sentence IS '填空题的完整句子，FILL_IN_BLANK 题型使用';
    `);
    console.log('✅ 字段注释添加成功\n');

    // 4. 验证字段是否存在
    console.log('4. 验证字段...');
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'vocabularies' AND column_name = 'audio_url'
      
      UNION ALL
      
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'sentence';
    `);

    console.log('验证结果：');
    console.table(result);

    if (result.length === 2) {
      console.log('\n✅ 迁移成功！所有字段已正确添加。');
    } else {
      console.log('\n⚠️ 警告：部分字段可能未添加成功，请检查。');
    }

  } catch (error) {
    console.error('\n❌ 迁移失败：', error.message);
    console.error('\n详细错误信息：', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行迁移
migrate()
  .then(() => {
    console.log('\n迁移完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('迁移过程中发生错误：', error);
    process.exit(1);
  });
