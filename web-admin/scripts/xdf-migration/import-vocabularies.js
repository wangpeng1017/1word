const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  console.log('直接从测试环境导入 vocabularies 到正式环境...');

  // 连接测试环境
  const sourceConn = await mysql.createConnection({
    host: '8.130.182.148',
    user: 'word_mysql',
    password: 'word_mysql_2024',
    database: 'word_app_mysql',
    ssl: false
  });

  // 连接正式环境
  const targetConn = await mysql.createConnection({
    host: 'rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com',
    port: 3306,
    user: 'PRO_RDS_bdcxcx_RW',
    password: '4n8anApuMflp3cRr',
    database: 'bdcxcx',
    ssl: false
  });

  console.log('✓ 两个数据库都已连接');

  // 从测试环境读取数据
  const [rows] = await sourceConn.query('SELECT * FROM vocabularies');
  console.log(`✓ 读取了 ${rows.length} 条记录`);

  // 清空正式环境数据
  await targetConn.query('DELETE FROM vocabularies');
  console.log('✓ 已清空目标表');

  // 批量插入
  let imported = 0;
  for (const row of rows) {
    const values = { ...row };

    // 处理 NULL 值 - 替换为空字符串或默认值
    for (const key of Object.keys(values)) {
      if (values[key] === null) {
        if (key === 'secondary_meaning' || key === 'phonetic_us' || key === 'phonetic_uk' || key === 'audio_url') {
          values[key] = '';
        }
      }
    }

    try {
      await targetConn.query('INSERT INTO vocabularies SET ?', [values]);
      imported++;
    } catch (err) {
      console.error(`✗ 插入失败 ${values.id}: ${err.message.substring(0, 50)}`);
    }
  }

  console.log(`✓ 成功导入 ${imported} 条记录`);

  // 验证
  const [count] = await targetConn.query('SELECT COUNT(*) as cnt FROM vocabularies');
  console.log(`✓ 验证: vocabularies 表有 ${count[0].cnt} 条记录`);

  await sourceConn.end();
  await targetConn.end();
  console.log('\n导入完成！');
}

main().catch(console.error);
