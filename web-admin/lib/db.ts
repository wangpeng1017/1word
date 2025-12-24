/**
 * @file db.ts
 * @desc 原生 PostgreSQL 数据库连接（绕过 Prisma）
 */
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
}
