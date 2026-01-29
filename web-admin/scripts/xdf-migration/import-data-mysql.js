const mysql = require('mysql2/promise');
const fs = require('fs');

const DATA_FILE = `${__dirname}/../../xdf-migration-data.json`;

// 转换日期格式：ISO 8601 -> MySQL DATETIME
function convertDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return value.replace('T', ' ').replace(/\.\d+Z$/, '');
  }
  return value;
}

// 处理值：null -> 空字符串（对于 NOT NULL 字段）
function processValue(value, columnName) {
  if (value === null || value === undefined) {
    // 对于可能为空的字符串字段，返回空字符串
    if (['email', 'phone', 'wechat_id', 'avatar', 'teacher_id'].includes(columnName)) {
      return '';
    }
    return null;
  }
  // 转换日期格式
  if (typeof value === 'string' && (value.includes('T') && value.includes('Z'))) {
    return convertDate(value);
  }
  return value;
}

async function main() {
  console.log('开始导入数据...');

  // 读取数据文件
  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(rawData);

  console.log(`导出的数据包含 ${Object.keys(data.tables).length} 个表`);

  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: 'rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com',
    port: 3306,
    user: 'PRO_RDS_bdcxcx_RW',
    password: '4n8anApuMflp3cRr',
    database: 'bdcxcx',
    ssl: false
  });

  console.log('数据库连接成功');

  // 按顺序导入各表数据
  const tables = [
    'users', 'teachers', 'students', 'classes', 'plan_classes',
    'vocabularies', 'questions', 'question_options', 'student_daily_tasks',
    'daily_tasks', 'proficiency_tests', 'question_answers', 'study_sessions',
    'study_records', 'wrong_questions', 'badges', 'student_badges',
    'achievements', 'student_achievements', 'redeemable_achievements',
    'achievement_redemptions', 'student_points', 'point_history',
    'operation_logs', 'vocabulary_images'
  ];

  let totalImported = 0;

  for (const tableName of tables) {
    const records = data.tables[tableName];
    if (!records || records.length === 0) {
      console.log(`跳过表 ${tableName} (无数据)`);
      continue;
    }

    console.log(`导入表 ${tableName}: ${records.length} 条记录...`);

    try {
      // 获取表的列信息
      const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
      const columnNames = columns.map(c => c.Field);

      let imported = 0;
      for (const record of records) {
        // 只插入表中存在的列，并处理值
        const values = {};
        for (const col of columnNames) {
          if (record.hasOwnProperty(col)) {
            values[col] = processValue(record[col], col);
          }
        }

        if (Object.keys(values).length > 0) {
          await connection.query(`INSERT INTO \`${tableName}\` SET ?`, [values]);
          imported++;
        }
      }

      console.log(`  ✓ 成功导入 ${imported} 条记录`);
      totalImported += imported;
    } catch (error) {
      console.error(`  ✗ 导入失败:`, error.message);
    }
  }

  console.log(`\n总计导入 ${totalImported} 条记录`);

  await connection.end();
  console.log('导入完成！');
}

main().catch(console.error);
