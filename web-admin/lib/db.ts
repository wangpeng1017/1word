/**
 * @file db.ts
 * @desc 原生 PostgreSQL 数据库连接（绕过 Prisma 硬编码问题）
 * @input 依赖: pg, DATABASE_URL 环境变量
 * @output 导出: db.query() 方法
 * @see 全局规则: CLAUDE.md "Prisma + Next.js 环境变量陷阱"
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
}
