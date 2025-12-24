/**
 * @file route.ts
 * @desc 用户登录 API（使用原生 pg 绕过 Prisma）
 * @input 依赖: lib/db, lib/auth, lib/response
 * @output 导出: POST /api/auth/login
 * ⚠️ 更新我时，请同步更新本注释及所属文件夹的 _INDEX.md
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { LoginRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, phone, studentNo, password } = body

    if (!password) {
      return errorResponse('密码不能为空')
    }

    const loginIdentifier = email || phone || studentNo
    if (!loginIdentifier) {
      return errorResponse('请输入账号（邮箱/手机号/学号）')
    }

    // 1) 按邮箱或手机号查用户
    let result = await db.query(
      `SELECT u.*, t.id as teacher_id, s.id as student_id
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       WHERE u.email = $1 OR u.phone = $1
       LIMIT 1`,
      [loginIdentifier]
    )

    // 2) 如果没查到，按学号查
    if (result.rows.length === 0) {
      const stuResult = await db.query(
        `SELECT user_id FROM students WHERE student_no = $1`,
        [loginIdentifier]
      )
      if (stuResult.rows.length > 0) {
        result = await db.query(
          `SELECT u.*, t.id as teacher_id, s.id as student_id
           FROM users u
           LEFT JOIN teachers t ON t.user_id = u.id
           LEFT JOIN students s ON s.user_id = u.id
           WHERE u.id = $1`,
          [stuResult.rows[0].user_id]
        )
      }
    }

    if (result.rows.length === 0) {
      return errorResponse('用户不存在')
    }

    const user = result.rows[0]

    if (!user.is_active) {
      return errorResponse('账号已被禁用')
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return errorResponse('密码错误')
    }

    const token = generateToken({
      userId: user.id,
      email: user.email || undefined,
      role: user.role,
    })

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        teacherId: user.teacher_id,
        studentId: user.student_id,
      },
      token,
    }, '登录成功')
  } catch (error) {
    console.error('登录错误:', error)
    return errorResponse('登录失败', 500)
  }
}
