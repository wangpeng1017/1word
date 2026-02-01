import { PrismaClient } from '@prisma/client'

/**
 * @file prisma.ts
 * @desc Prisma 客户端配置，支持读写分离
 * @see docs/XDF_部署方案_完整版.md
 *
 * 读写分离说明：
 * - prisma: 主库连接，用于所有写操作（INSERT/UPDATE/DELETE）
 * - prismaRead: 从库连接，用于只读查询（SELECT）
 *
 * 使用方式：
 * - 写操作: import { prisma } from '@/lib/prisma'
 * - 读操作: import { prismaRead } from '@/lib/prisma'
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaRead: PrismaClient | undefined
}

/**
 * 主库客户端（读写）
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    transactionOptions: {
      maxWait: 10000,
      timeout: 30000,
    },
  })
}

/**
 * 从库客户端（只读）
 * 如果未配置 DATABASE_URL_REPLICA，则回退到主库
 */
const prismaReadClientSingleton = () => {
  const replicaUrl = process.env.DATABASE_URL_REPLICA || process.env.DATABASE_URL

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: replicaUrl,
      },
    },
  })
}

// 主库实例（用于写操作）
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// 从库实例（用于读操作）
export const prismaRead = globalForPrisma.prismaRead ?? prismaReadClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaRead = prismaRead
}

/**
 * 检查是否启用了读写分离
 */
export function isReadReplicaEnabled(): boolean {
  return !!process.env.DATABASE_URL_REPLICA
}
