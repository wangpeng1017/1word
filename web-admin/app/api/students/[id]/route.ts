import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/students/[id] - 获取单个学生信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        class: true,
      },
    })

    if (!student) {
      return apiResponse.notFound('学生不存在')
    }

    const result = {
      id: student.id,
      name: student.user.name,
      studentNo: student.studentNo,
      grade: student.grade,
      class: student.class,
      email: student.user.email,
      phone: student.user.phone,
    }

    return apiResponse.success(result)
  } catch (error) {
    console.error('获取学生信息失败:', error)
    return apiResponse.error('获取学生信息失败')
  }
}
