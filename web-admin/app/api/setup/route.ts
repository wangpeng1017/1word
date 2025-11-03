import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { createEnumsSQLArray, createTablesSQLArray, addForeignKeysSQLArray, alterColumnsToEnumSQLArray, ensureColumnsSQLArray } from '@/lib/create-tables'

// 数据库初始化接口
export async function POST(request: NextRequest) {
  try {
    // 无论当前状态如何，优先确保：补齐缺失列 + 创建枚举类型 + 迁移列类型
    try {
      // 0) 补齐缺失列（幂等）
      for (const sql of ensureColumnsSQLArray) {
        try { await prisma.$executeRawUnsafe(sql) } catch (_) {}
      }

      // 1) 创建枚举（若已存在则忽略）
      for (const sql of createEnumsSQLArray) {
        try {
          await prisma.$executeRawUnsafe(sql)
        } catch (enumError: any) {
          if (!enumError.message?.toLowerCase().includes('already exists')) {
            throw enumError
          }
        }
      }

      // 2) 迁移已存在表的列类型为枚举（如果列/表不存在，DO 块内会跳过）
      for (const sql of alterColumnsToEnumSQLArray) {
        await prisma.$executeRawUnsafe(sql)
      }
    } catch (preError) {
      console.error('确保枚举/列类型失败(将继续尝试创建表):', preError)
    }
    // 检查是否已经初始化（通过查询用户表）
    try {
      const userCount = await prisma.user.count()
      if (userCount > 0) {
        return errorResponse('数据库已初始化，无需重复执行')
      }
    } catch (error: any) {
      // 如果表不存在，创建所有表
      if (error.message?.includes('does not exist')) {
        try {
          console.log('表不存在，开始初始化数据库...')
          
          // 1. 再次确保枚举类型（幂等）
          console.log('创建枚举类型(幂等)...')
          for (const sql of createEnumsSQLArray) {
            try { await prisma.$executeRawUnsafe(sql) } catch (enumError: any) {
              if (!enumError.message?.toLowerCase().includes('already exists')) throw enumError
            }
          }
          
          // 2. 创建表
          console.log('创建数据库表...')
          for (const sql of createTablesSQLArray) {
            await prisma.$executeRawUnsafe(sql)
          }
          
          // 3. 添加外键约束
          console.log('添加外键约束...')
          for (const sql of addForeignKeysSQLArray) {
            await prisma.$executeRawUnsafe(sql)
          }

          // 4. 迁移列类型为枚举（幂等）
          console.log('迁移列类型为枚举(幂等)...')
          for (const sql of alterColumnsToEnumSQLArray) {
            await prisma.$executeRawUnsafe(sql)
          }
          
          console.log('所有表和约束创建成功')
        } catch (createError: any) {
          console.error('创建表失败:', createError)
          return errorResponse(`创建数据库表失败: ${createError.message}`, 500)
        }
      } else {
        throw error
      }
    }

    // 创建默认管理员账号（使用原生SQL，避免潜在的枚举类型/客户端缓存问题）
    const hashedPassword = await hashPassword('admin123456')

    const inserted = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO "users" ("email","password","name","role","is_active")
       VALUES ('admin@vocab.com','${hashedPassword}','系统管理员','TEACHER', true)
       ON CONFLICT ("email") DO NOTHING
       RETURNING id;`
    )

    let adminUserId = inserted[0]?.id
    if (!adminUserId) {
      const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT "id" FROM "users" WHERE "email"='admin@vocab.com' LIMIT 1;`
      )
      adminUserId = existing[0]?.id
    }

    if (!adminUserId) {
      return errorResponse('创建管理员账号失败：未能获取用户ID', 500)
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO "teachers" ("user_id","school")
       VALUES ('${adminUserId}','示例学校')
       ON CONFLICT ("user_id") DO NOTHING;`
    )

    return successResponse({
      message: '数据库初始化成功',
      admin: {
        email: 'admin@vocab.com',
        password: 'admin123456',
      },
    }, '初始化成功！请使用管理员账号登录')
  } catch (error: any) {
    console.error('初始化错误:', error)
    return errorResponse(`初始化失败: ${error.message}`, 500)
  }
}

// 获取初始化状态
export async function GET(request: NextRequest) {
  try {
    // 先进行一次补齐缺失列（幂等），避免登录失败
    try {
      for (const sql of ensureColumnsSQLArray) {
        try { await prisma.$executeRawUnsafe(sql) } catch (_) {}
      }
    } catch (_) {}

    const userCount = await prisma.user.count()
    return successResponse({
      initialized: userCount > 0,
      userCount,
    })
  } catch (error: any) {
    // 如果表不存在，说明未初始化
    if (error.message?.includes('does not exist')) {
      return successResponse({
        initialized: false,
        userCount: 0,
        needsSetup: true,
      })
    }
    throw error
  }
}
