/**
 * @file db.ts
 * @desc 数据库连接（自动检测 PostgreSQL 或 MySQL）
 * @input 依赖: pg 或 mysql2, DATABASE_URL 环境变量
 * @output 导出: db.query() 方法
 * @see 全局规则: CLAUDE.md "Prisma + Next.js 环境变量陷阱"
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */

const DATABASE_URL = process.env.DATABASE_URL || ''
const isMySQL = DATABASE_URL.startsWith('mysql://')

// MySQL 连接池
let mysqlPool: import('mysql2/promise').Pool | null = null

// PostgreSQL 连接池
let pgPool: import('pg').Pool | null = null

async function getMySQLPool() {
  if (!mysqlPool) {
    const mysql = await import('mysql2/promise')
    mysqlPool = mysql.createPool(DATABASE_URL)
  }
  return mysqlPool
}

function getPGPool() {
  if (!pgPool) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg')
    pgPool = new Pool({ connectionString: DATABASE_URL })
  }
  return pgPool
}

// 将 PostgreSQL 风格的 $1, $2 转换为 MySQL 的 ?
function convertToMySQLQuery(text: string): string {
  return text.replace(/\$(\d+)/g, '?')
}

export const db = {
  async query(text: string, params?: unknown[]) {
    if (isMySQL) {
      const pool = await getMySQLPool()
      const mysqlQuery = convertToMySQLQuery(text)
      const [rows] = await pool.query(mysqlQuery, params)
      // 模拟 pg 的返回格式 { rows: [...] }
      return { rows: Array.isArray(rows) ? rows : [rows] }
    } else {
      const pool = getPGPool()
      return pool!.query(text, params)
    }
  },
}
