const mysql = require('mysql2/promise');
const fs = require('fs');

const DATA_FILE = `${__dirname}/../../xdf-migration-data.json`;

// 转换日期格式：ISO 8601 -> MySQL DATETIME
function convertDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }
  return value;
}

// 生成唯一占位符
let placeholderCounter = {};
function generatePlaceholder(columnName, prefix = '') {
  if (!placeholderCounter[columnName]) {
    placeholderCounter[columnName] = 0;
  }
  return `no-${columnName}-${prefix || Date.now()}-${placeholderCounter[columnName]++}`;
}

// 处理字段值
function processValue(value, columnName, recordId) {
  // null/undefined 处理
  if (value === null || value === undefined) {
    // 对于 NOT NULL 的字符串字段，使用占位符或空字符串
    const notNullStringFields = ['email', 'phone', 'wechat_id', 'avatar', 'teacher_id', 'targetId', 'sentence', 'lastActiveAt', 'lastReviewAt', 'pointsCost'];
    if (notNullStringFields.includes(columnName)) {
      if (columnName === 'email' || columnName === 'wechat_id') {
        return generatePlaceholder(columnName, recordId);
      }
      if (columnName === 'pointsCost') return 0;
      return '';
    }
    return null;
  }

  // 空字符串处理
  if (value === '') {
    const notNullFields = ['email', 'wechat_id', 'pointsCost'];
    if (notNullFields.includes(columnName)) {
      if (columnName === 'pointsCost') return 0;
      return generatePlaceholder(columnName, recordId);
    }
    return '';
  }

  // 日期转换
  if (typeof value === 'string') {
    if (value.includes('T') && value.includes('Z')) {
      return convertDate(value);
    }
    // 处理布尔值字符串
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  return value;
}

// 清空表数据（按外键依赖顺序）
async function clearTables(connection) {
  const tables = [
    'achievement_redemptions', 'student_achievements', 'redeemable_achievements',
    'student_badges', 'badges', 'achievements',
    'point_history', 'student_points',
    'wrong_questions', 'question_answers', 'question_options', 'questions',
    'student_daily_tasks', 'daily_tasks', 'proficiency_tests',
    'study_records', 'study_sessions',
    'plan_classes', 'classes', 'students', 'teachers', 'users',
    'vocabulary_images', 'vocabularies',
    'operation_logs'
  ];

  for (const table of tables) {
    try {
      await connection.query(`DELETE FROM \`${table}\``);
      console.log(`  ✓ 清空表 ${table}`);
    } catch (error) {
      console.log(`  - 跳过表 ${table}: ${error.message.substring(0, 50)}`);
    }
  }
}

async function main() {
  console.log('=== 开始完整数据迁移 ===\n');

  // 读取数据文件
  console.log('1. 读取数据文件...');
  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(rawData);
  console.log(`   ✓ 数据包含 ${Object.keys(data.tables).length} 个表\n`);

  // 创建数据库连接
  console.log('2. 连接数据库...');
  const connection = await mysql.createConnection({
    host: 'rm-2zel9bu41o5s0v0j8.mysql.rds.aliyuncs.com',
    port: 3306,
    user: 'PRO_RDS_bdcxcx_RW',
    password: '4n8anApuMflp3cRr',
    database: 'bdcxcx',
    ssl: false,
    multipleStatements: true
  });
  console.log('   ✓ 连接成功\n');

  // 清空现有数据
  console.log('3. 清空现有数据...');
  await clearTables(connection);
  console.log('');

  // 导入数据
  console.log('4. 导入数据...');
  const tables = Object.keys(data.tables);
  let totalImported = 0;
  let failedTables = [];

  for (const tableName of tables) {
    const records = data.tables[tableName];
    if (!records || records.length === 0) {
      console.log(`   - 跳过表 ${tableName} (无数据)`);
      continue;
    }

    console.log(`   导入表 ${tableName}: ${records.length} 条...`);

    try {
      // 检查表是否存在
      const [tableCheck] = await connection.query(`SHOW TABLES LIKE ?`, [tableName]);
      if (tableCheck.length === 0) {
        console.log(`     - 表不存在，跳过`);
        continue;
      }

      // 获取表结构
      const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
      const columnNames = columns.map(c => c.Field);

      let imported = 0;
      let batchValues = [];
      const batchSize = 100;

      for (const record of records) {
        const values = {};
        const recordId = record.id || tableName;

        for (const col of columnNames) {
          if (record.hasOwnProperty(col)) {
            const processed = processValue(record[col], col, recordId);
            if (processed !== undefined) {
              values[col] = processed;
            }
          }
        }

        if (Object.keys(values).length > 0) {
          batchValues.push(values);
          if (batchValues.length >= batchSize) {
            for (const v of batchValues) {
              await connection.query(`INSERT INTO \`${tableName}\` SET ?`, [v]);
              imported++;
            }
            batchValues = [];
          }
        }
      }

      // 插入剩余记录
      for (const v of batchValues) {
        await connection.query(`INSERT INTO \`${tableName}\` SET ?`, [v]);
        imported++;
      }

      console.log(`     ✓ 成功导入 ${imported} 条记录`);
      totalImported += imported;
    } catch (error) {
      console.log(`     ✗ 失败: ${error.message.substring(0, 80)}`);
      failedTables.push({ table: tableName, error: error.message });
    }
  }

  console.log(`\n5. 导入完成！`);
  console.log(`   总计导入: ${totalImported} 条记录`);

  if (failedTables.length > 0) {
    console.log(`\n   失败的表 (${failedTables.length}):`);
    failedTables.forEach(f => {
      console.log(`   - ${f.table}: ${f.error.substring(0, 50)}`);
    });
  }

  await connection.end();
  console.log('\n=== 迁移完成 ===');
}

main().catch(console.error);
