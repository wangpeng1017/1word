import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/test-records - 获取词汇量测试记录列表
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (studentId) where.studentId = studentId

    // 支持按学生姓名或学号搜索
    if (search) {
      where.students = {
        OR: [
          { student_no: { contains: search } },
          { user: { name: { contains: search } } },
        ],
      }
    }

    const [records, total] = await Promise.all([
      prisma.vocabulary_quiz_records.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          students: {
            select: {
              id: true,
              student_no: true,
              user: {
                select: {
                  name: true,
                },
              },
              classes: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.vocabulary_quiz_records.count({ where }),
    ])

    return apiResponse.success({
      records,
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('获取测试记录失败:', error)
    return apiResponse.error(`获取测试记录失败: ${error?.message || '未知错误'}`)
  }
}

// POST /api/test-records - 提交测试记录（保持原有 proficiency test 逻辑不变）
// 小程序词汇量测试通过 /api/vocabulary-quiz/submit 提交
