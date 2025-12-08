import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/test-records - 获取测试记录列表
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
    const testId = searchParams.get('testId')
    const studentId = searchParams.get('studentId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (testId) where.testId = testId
    if (studentId) where.studentId = studentId

    const [records, total] = await Promise.all([
      prisma.test_records.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          proficiency_tests: {
            select: {
              id: true,
              name: true,
              totalWords: true,
              passScore: true
            }
          },
          students: {
            select: {
              id: true,
              student_no: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),
      prisma.test_records.count({ where })
    ])

    return apiResponse.success({
      records,
      total,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('获取测试记录失败:', error)
    return apiResponse.error(`获取测试记录失败: ${error?.message || '未知错误'}`)
  }
}

// POST /api/test-records - 提交测试记录
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const body = await request.json()
    const {
      testId,
      studentId,
      answers, // [{ vocabularyId, questionId, answer, isCorrect }]
      startedAt,
      completedAt
    } = body

    // 验证必填字段
    if (!testId || !studentId || !answers || !Array.isArray(answers)) {
      return apiResponse.error('参数错误：testId、studentId和answers为必填项', 400)
    }

    // 验证测试题库是否存在
    const test = await prisma.proficiency_tests.findUnique({
      where: { id: testId }
    })

    if (!test) {
      return apiResponse.error('测试题库不存在', 404)
    }

    if (!test.isActive) {
      return apiResponse.error('该测试题库已停用', 400)
    }

    // 验证学生是否存在
    const student = await prisma.students.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return apiResponse.error('学生不存在', 404)
    }

    // 计算统计数据
    const totalQuestions = answers.length
    const correctCount = answers.filter((a: any) => a.isCorrect).length
    const wrongCount = totalQuestions - correctCount
    const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0
    const score = Math.round(accuracy * 100)

    // 计算总用时（秒）
    const start = new Date(startedAt)
    const end = completedAt ? new Date(completedAt) : new Date()
    const totalTime = Math.floor((end.getTime() - start.getTime()) / 1000)

    // 创建测试记录
    const recordId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const record = await prisma.test_records.create({
      data: {
        id: recordId,
        testId,
        studentId,
        totalQuestions,
        correctCount,
        wrongCount,
        score,
        accuracy,
        totalTime,
        startedAt: start,
        completedAt: completedAt ? end : null,
        isCompleted: !!completedAt,
        answers,
        updatedAt: new Date()
      },
      include: {
        proficiency_tests: {
          select: {
            name: true,
            passScore: true
          }
        }
      }
    })

    // 判断是否通过
    const isPassed = score >= test.passScore

    return apiResponse.success({
      message: '测试记录提交成功',
      record,
      isPassed,
      stats: {
        totalQuestions,
        correctCount,
        wrongCount,
        score,
        accuracy: Math.round(accuracy * 100),
        totalTime,
        passScore: test.passScore
      }
    })
  } catch (error: any) {
    console.error('提交测试记录失败:', error)
    return apiResponse.error(`提交测试记录失败: ${error?.message || '未知错误'}`)
  }
}
