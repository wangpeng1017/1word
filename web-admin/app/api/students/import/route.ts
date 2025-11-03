import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { StudentImportRow } from '@/types'

// 批量导入学生
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    const payload = verifyToken(token || '')
    if (!payload || payload.role !== 'TEACHER') {
      return unauthorizedResponse('只有教师可以导入学生')
    }

    const body = await request.json()
    const { students, defaultPassword } = body as {
      students: StudentImportRow[]
      defaultPassword?: string
    }

    if (!students || students.length === 0) {
      return errorResponse('学生数据不能为空')
    }

    const password = defaultPassword || '123456'
    const hashedPassword = await hashPassword(password)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const studentData of students) {
      try {
        const { name, studentNo, grade, className } = studentData

        if (!name || !studentNo) {
          results.failed++
          results.errors.push(`学号 ${studentNo || '未知'}: 姓名或学号为空`)
          continue
        }

        // 检查学号是否已存在
        const existing = await prisma.student.findUnique({
          where: { studentNo },
        })

        if (existing) {
          results.failed++
          results.errors.push(`学号 ${studentNo}: 已存在`)
          continue
        }

        // 查找班级
        let classId: string | undefined
        if (className) {
          const classData = await prisma.class.findFirst({
            where: { name: className },
          })
          classId = classData?.id
        }

        // 创建用户和学生
        await prisma.user.create({
          data: {
            name,
            password: hashedPassword,
            role: 'STUDENT',
            student: {
              create: {
                studentNo,
                classId,
                grade,
              },
            },
          },
        })

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`学号 ${studentData.studentNo}: ${error}`)
      }
    }

    return successResponse(results, `导入完成，成功 ${results.success} 个，失败 ${results.failed} 个`)
  } catch (error) {
    console.error('批量导入学生错误:', error)
    return errorResponse('批量导入失败', 500)
  }
}
