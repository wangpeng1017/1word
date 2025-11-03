import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { createTablesSQLArray, addForeignKeysSQLArray } from '@/lib/create-tables'

// 数据库初始化接口
export async function POST(request: NextRequest) {
  try {
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
          console.log('表不存在，开始创建所有表...')
          
          // 逐条执行创建表的SQL
          for (const sql of createTablesSQLArray) {
            await prisma.$executeRawUnsafe(sql)
          }
          
          console.log('表创建成功，开始添加外键约束...')
          
          // 添加外键约束
          for (const sql of addForeignKeysSQLArray) {
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

    // 创建默认管理员账号
    const hashedPassword = await hashPassword('admin123456')
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@vocab.com',
        password: hashedPassword,
        name: '系统管理员',
        role: 'TEACHER',
        teacher: {
          create: {
            school: '示例学校',
          },
        },
      },
    })

    return successResponse({
      message: '数据库初始化成功',
      admin: {
        email: 'admin@vocab.com',
        password: 'admin123456',
        name: admin.name,
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
