const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  console.log('=== 从 TSV 文件导入 vocabularies ===\n');

  // 连接正式环境
  const conn = await mysql.createConnection({
    host: 'rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com',
    port: 3306,
    user: 'PRO_RDS_bdcxcx_RW',
    password: '4n8anApuMflp3cRr',
    database: 'bdcxcx',
    ssl: false
  });

  console.log('✓ 数据库已连接');

  // 清空现有数据
  await conn.query('DELETE FROM vocabularies');
  console.log('✓ 已清空表');

  // 读取 TSV 文件
  const data = fs.readFileSync(`${__dirname}/vocabularies_data.tsv`, 'utf-8');
  const lines = data.trim().split('\n');
  console.log(`✓ 读取了 ${lines.length} 行数据`);

  let imported = 0;
  let errorCount = 0;

  for (const line of lines) {
    // 处理制表符分隔的数据
    const parts = line.split('\t');
    if (parts.length < 13) continue;

    const [id, word, part_of_speech, primary_meaning, secondary_meaning, phonetic, phonetic_us, phonetic_uk, audio_url, is_high_frequency, difficulty, created_at, updated_at] = parts;

    try {
      await conn.query(
        `INSERT INTO vocabularies (id, word, part_of_speech, primary_meaning, secondary_meaning, phonetic, phonetic_us, phonetic_uk, audio_url, is_high_frequency, difficulty, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, word, part_of_speech, primary_meaning, secondary_meaning, phonetic, phonetic_us, phonetic_uk, audio_url, is_high_frequency, difficulty, created_at, updated_at]
      );
      imported++;
    } catch (err) {
      errorCount++;
      if (errorCount <= 5) {
        console.error(`✗ 失败 ${id}: ${err.message.substring(0, 50)}`);
      }
    }
  }

  console.log(`\n✓ 成功导入 ${imported} 条记录`);
  if (errorCount > 0) {
    console.log(`  失败: ${errorCount} 条`);
  }

  // 验证
  const [count] = await conn.query('SELECT COUNT(*) as cnt FROM vocabularies');
  console.log(`\n✓ 验证: vocabularies 表有 ${count[0].cnt} 条记录`);

  await conn.end();
  console.log('\n=== 导入完成 ===');
}

main().catch(console.error);
