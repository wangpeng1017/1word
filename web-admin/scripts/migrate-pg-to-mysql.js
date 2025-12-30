/**
 * @file PostgreSQL → MySQL 数据迁移脚本
 * @desc 将 PostgreSQL 数据导出并导入到 MySQL
 *
 * 使用方法：
 * 1. 在服务器上运行：node scripts/migrate-pg-to-mysql.js export
 * 2. 然后运行：node scripts/migrate-pg-to-mysql.js import
 */

const { Client: PgClient } = require('pg')
const mysql = require('mysql2/promise')
const fs = require('fs').promises
const path = require('path')

// 配置
const PG_URL = process.env.PG_DATABASE_URL || 'postgresql://word_user:word_pass_2024@localhost:5432/word_app'
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'word_mysql',
  password: process.env.MYSQL_PASSWORD || 'word_mysql_2024',
  database: process.env.MYSQL_DATABASE || 'word_app_mysql',
  charset: 'utf8mb4'
}

const DATA_DIR = path.join(__dirname, '../data/migration')

// 表顺序（按依赖关系排序，被依赖的表在前）
const TABLE_ORDER = [
  'users',
  'teachers',
  'classes',
  'students',
  'vocabularies',
  'vocabulary_packs',
  'vocabulary_pack_days',
  'vocabulary_pack_day_words',
  'word_meanings',
  'word_audios',
  'word_images',
  'questions',
  'question_options',
  'plan_classes',
  'daily_tasks',
  'study_plans',
  'study_records',
  'proficiency_tests',
  'test_records',
  'word_masteries',
  'wrong_questions',
  'question_answers',
  'student_points',
  'point_history',
  'achievements',
  'student_achievements',
  'study_streaks',
  'system_configs',
  'operation_logs'
]

// PostgreSQL 表名到实际表名的映射（Prisma 可能会修改表名）
const PG_TABLE_MAP = {
  'users': 'users',  // user model 映射到 users 表
}

/**
 * 导出 PostgreSQL 数据
 */
async function exportFromPostgres() {
  console.log('🔵 开始从 PostgreSQL 导出数据...')

  const client = new PgClient({ connectionString: PG_URL })
  await client.connect()
  console.log('✅ 已连接 PostgreSQL')

  // 创建数据目录
  await fs.mkdir(DATA_DIR, { recursive: true })

  // 获取所有表
  const tablesResult = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE '_prisma%'
    ORDER BY tablename
  `)

  const tables = tablesResult.rows.map(r => r.tablename)
  console.log(`📋 找到 ${tables.length} 张表: ${tables.join(', ')}`)

  for (const table of tables) {
    try {
      const result = await client.query(`SELECT * FROM "${table}"`)
      const data = result.rows

      // 处理特殊类型
      const processedData = data.map(row => {
        const newRow = { ...row }
        for (const key in newRow) {
          // 处理日期
          if (newRow[key] instanceof Date) {
            newRow[key] = newRow[key].toISOString()
          }
          // 数组转 JSON（String[] → Json）
          if (Array.isArray(newRow[key])) {
            newRow[key] = JSON.stringify(newRow[key])
          }
        }
        return newRow
      })

      const filePath = path.join(DATA_DIR, `${table}.json`)
      await fs.writeFile(filePath, JSON.stringify(processedData, null, 2))
      console.log(`  ✅ ${table}: ${data.length} 条记录`)
    } catch (error) {
      console.error(`  ❌ ${table}: ${error.message}`)
    }
  }

  await client.end()
  console.log('🎉 PostgreSQL 数据导出完成!')
}

/**
 * 导入数据到 MySQL
 */
async function importToMySQL() {
  console.log('🔵 开始导入数据到 MySQL...')

  const connection = await mysql.createConnection(MYSQL_CONFIG)
  console.log('✅ 已连接 MySQL')

  // 禁用外键检查
  await connection.execute('SET FOREIGN_KEY_CHECKS = 0')
  await connection.execute('SET SESSION sql_mode = ""')

  // 按顺序导入
  for (const table of TABLE_ORDER) {
    const filePath = path.join(DATA_DIR, `${table}.json`)

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(fileContent)

      if (data.length === 0) {
        console.log(`  ⏭️  ${table}: 空表，跳过`)
        continue
      }

      // 清空表
      await connection.execute(`TRUNCATE TABLE \`${table}\``)

      // 批量插入
      const columns = Object.keys(data[0])
      const placeholders = columns.map(() => '?').join(', ')
      const sql = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`

      let inserted = 0
      for (const row of data) {
        const values = columns.map(col => {
          const val = row[col]
          if (val === null || val === undefined) return null
          // 处理 JSON 字段
          if (typeof val === 'object') return JSON.stringify(val)
          return val
        })

        try {
          await connection.execute(sql, values)
          inserted++
        } catch (err) {
          console.error(`    插入失败 (${table}):`, err.message)
        }
      }

      console.log(`  ✅ ${table}: ${inserted}/${data.length} 条记录`)
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`  ⏭️  ${table}: 无数据文件，跳过`)
      } else {
        console.error(`  ❌ ${table}: ${error.message}`)
      }
    }
  }

  // 恢复外键检查
  await connection.execute('SET FOREIGN_KEY_CHECKS = 1')
  await connection.end()

  console.log('🎉 MySQL 数据导入完成!')
}

/**
 * 验证迁移
 */
async function verify() {
  console.log('🔵 验证迁移结果...')

  const pgClient = new PgClient({ connectionString: PG_URL })
  await pgClient.connect()

  const mysqlConn = await mysql.createConnection(MYSQL_CONFIG)

  for (const table of TABLE_ORDER) {
    try {
      const pgResult = await pgClient.query(`SELECT COUNT(*) as count FROM "${table}"`)
      const [mysqlResult] = await mysqlConn.execute(`SELECT COUNT(*) as count FROM \`${table}\``)

      const pgCount = parseInt(pgResult.rows[0].count)
      const mysqlCount = parseInt(mysqlResult[0].count)

      const status = pgCount === mysqlCount ? '✅' : '❌'
      console.log(`  ${status} ${table}: PG=${pgCount}, MySQL=${mysqlCount}`)
    } catch (error) {
      console.log(`  ⚠️  ${table}: ${error.message}`)
    }
  }

  await pgClient.end()
  await mysqlConn.end()
  console.log('🎉 验证完成!')
}

// 主函数
async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'export':
      await exportFromPostgres()
      break
    case 'import':
      await importToMySQL()
      break
    case 'verify':
      await verify()
      break
    case 'all':
      await exportFromPostgres()
      await importToMySQL()
      await verify()
      break
    default:
      console.log(`
用法: node migrate-pg-to-mysql.js <command>

命令:
  export  - 从 PostgreSQL 导出数据到 JSON 文件
  import  - 从 JSON 文件导入数据到 MySQL
  verify  - 验证迁移结果（比较两边数据量）
  all     - 执行完整迁移流程（export → import → verify）

环境变量:
  PG_DATABASE_URL  - PostgreSQL 连接字符串
  MYSQL_HOST       - MySQL 主机
  MYSQL_PORT       - MySQL 端口
  MYSQL_USER       - MySQL 用户
  MYSQL_PASSWORD   - MySQL 密码
  MYSQL_DATABASE   - MySQL 数据库名
      `)
  }
}

main().catch(console.error)
