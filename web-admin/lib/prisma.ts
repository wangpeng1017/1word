import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
    // 强制使用运行时环境变量
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // 事务配置
    transactionOptions: {
      maxWait: 10000,
      timeout: 30000,
    },
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
