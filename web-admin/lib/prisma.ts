import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 确保连接池大小足够（默认只有 5，200 学生并发时不够用）
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || ''
  if (url && !url.includes('connection_limit')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}connection_limit=20`
  }
  return url
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    transactionOptions: {
      maxWait: 10000,
      timeout: 30000,
    },
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

