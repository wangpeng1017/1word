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

// 所有需要默认值的 NOT NULL 字段
const DEFAULT_VALUES = {
  // 字符串字段
  'email': () => generatePlaceholder('email'),
  'phone': () => '',
  'wechat_id': () => generatePlaceholder('wechat_id'),
  'avatar': () => '',
  'teacher_id': () => '',
  'targetId': () => generatePlaceholder('targetId'),
  'sentence': () => '',
  'audioUrl': () => '',
  'questionText': () => '',
  'description': () => '',
  'achievementId': () => generatePlaceholder('achievementId'),
  'ip': () => '127.0.0.1',
  'condition': () => '{}',
  // 数字字段
  'pointsCost': () => 0,
  'duration': () => 0,
  'recentAccuracy': () => 0,
  // 日期字段
  'lastActiveAt': () => new Date().toISOString().slice(0, 19).replace('T', ' '),
  'lastReviewAt': () => new Date().toISOString().slice(0, 19).replace('T', ' '),
  'createdAt': () => new Date().toISOString().slice(0, 19).replace('T', ' '),
  'updatedAt': () => new Date().toISOString().slice(0, 19).replace('T', ' '),
};

// 处理字段值
function processValue(value, columnName, recordId) {
  // null/undefined 处理
  if (value === null || value === undefined) {
    if (DEFAULT_VALUES[columnName]) {
      return DEFAULT_VALUES[columnName]();
    }
    return null;
  }

  // 空字符串处理
  if (value === '') {
    if (DEFAULT_VALUES[columnName]) {
      return DEFAULT_VALUES[columnName]();
    }
    return '';
  }

  // 日期转换
  if (typeof value === 'string') {
    // ISO 8601 日期
    if (value.includes('T') && value.includes('Z')) {
      return convertDate(value);
    }
    // 空日期字符串
    if (value === '' && (columnName.endsWith('At') || columnName.endsWith('_at') || columnName.endsWith('Date'))) {
      if (DEFAULT_VALUES[columnName]) {
        return DEFAULT_VALUES[columnName]();
      }
      return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    // 处理布尔值字符串
    if (value === 'true') return true;
    if (value === 'false') return false;
  }

  // JSON 对象转换（处理 condition 字段）
  if (typeof value === 'object' && value !== null) {
    const jsonStr = JSON.stringify(value);
    // 验证 JSON 格式
    try {
      JSON.parse(jsonStr);
      return jsonStr;
    } catch {
      return '{}';
    }
  }

  return value;
}

// 使用字段名列表方式插入，避免特殊字符问题
async function insertRecord(connection, tableName, values) {
  const columns = Object.keys(values);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;
  await connection.query(sql, Object.values(values));
}

// 清空表数据（按外键依赖顺序）
async function clearTables(connection) {
  const tables = [
    'achievement_redemptions', 'student_achievements', 'redeemable_achievements',
    'student_badges', 'badges', 'achievements',
    'point_history', 'student_points',
    'wrong_questions', 'question_answers', 'question_options', 'questions',
    'vocabulary_quiz_records', 'vocabulary_quiz_answers', 'vocabulary_quiz_questions',
    'word_masteries', 'study_records', 'word_meanings', 'word_images', 'word_audios',
    'vocabulary_pack_day_words', 'vocabulary_pack_days', 'vocabulary_packs', 'vocabularies',
    'student_daily_tasks', 'daily_tasks', 'proficiency_tests',
    'study_plans', 'study_streaks',
    'plan_classes', 'classes', 'students', 'teachers', 'users',
    'vocabulary_images',
    'system_configs', 'operation_logs'
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
  console.log('=== 开始完整数据迁移 v2 ===\n');

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
    multipleStatements: false
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
  let successTables = [];

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
        failedTables.push({ table: tableName, error: '表不存在' });
        continue;
      }

      // 获取表结构
      const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
      const columnNames = columns.map(c => c.Field);
      const nullableCols = new Set(columns.filter(c => c.Null === 'YES').map(c => c.Field));

      let imported = 0;
      let errorCount = 0;

      for (const record of records) {
        try {
          const values = {};
          const recordId = record.id || tableName;

          for (const col of columnNames) {
            if (record.hasOwnProperty(col)) {
              let processed = processValue(record[col], col, recordId);
              // 如果字段 NOT NULL 且处理后仍为 null，使用默认值
              if (processed === null && !nullableCols.has(col) && DEFAULT_VALUES[col]) {
                processed = DEFAULT_VALUES[col]();
              }
              if (processed !== undefined) {
                values[col] = processed;
              }
            }
          }

          if (Object.keys(values).length > 0) {
            await insertRecord(connection, tableName, values);
            imported++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      if (imported > 0) {
        console.log(`     ✓ 成功导入 ${imported} 条记录${errorCount > 0 ? ` (失败 ${errorCount})` : ''}`);
        totalImported += imported;
        successTables.push(tableName);
      } else {
        console.log(`     ✗ 全部失败`);
        failedTables.push({ table: tableName, error: '全部记录导入失败' });
      }
    } catch (error) {
      console.log(`     ✗ 失败: ${error.message.substring(0, 100)}`);
      failedTables.push({ table: tableName, error: error.message });
    }
  }

  console.log(`\n5. 导入完成！`);
  console.log(`   总计导入: ${totalImported} 条记录`);
  console.log(`   成功表: ${successTables.length}`);
  console.log(`   失败表: ${failedTables.length}`);

  if (failedTables.length > 0) {
    console.log(`\n   失败的表:`);
    failedTables.forEach(f => {
      console.log(`   - ${f.table}: ${f.error.substring(0, 60)}`);
    });
  } else {
    console.log(`\n   🎉 所有表导入成功！`);
  }

  await connection.end();
  console.log('\n=== 迁移完成 ===');
}

main().catch(console.error);
