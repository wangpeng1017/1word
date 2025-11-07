import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// DELETE /api/vocabularies/[id]/questions/[questionId] - 删除题目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const { id: vocabularyId, questionId } = await params

  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    // 删除题目（级联删除选项）
    await prisma.questions.delete({
      where: { id: questionId },
    })

    return apiResponse.success({ message: '删除成功' })
  } catch (error) {
    console.error('删除题目失败:', error)
    return apiResponse.error('删除题目失败')
  }
}
