import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 数据库初始化接口
export async function POST(request: NextRequest) {
  try {
    // 检查是否已经初始化（通过查询用户表）
    let needsDbPush = false
    try {
      const userCount = await prisma.user.count()
      if (userCount > 0) {
        return errorResponse('数据库已初始化，无需重复执行')
      }
    } catch (error: any) {
      // 如果表不存在，需要执行 db push
      if (error.message?.includes('does not exist')) {
        needsDbPush = true
      } else {
        throw error
      }
    }

    // 如果需要，执行 prisma db push
    if (needsDbPush) {
      try {
        console.log('执行 prisma db push...')
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss --skip-generate', {
          cwd: process.cwd(),
          env: process.env,
        })
        console.log('prisma db push 输出:', stdout)
        if (stderr) console.error('prisma db push 错误:', stderr)
      } catch (error: any) {
        console.error('prisma db push 失败:', error)
        return errorResponse(`创建数据库表失败: ${error.message}`, 500)
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
