import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/proficiency-tests/[id] - 获取测试题库详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const { id } = params

    const test = await prisma.proficiency_tests.findUnique({
      where: { id },
      include: {
        _count: {
          select: { test_records: true }
        }
      }
    })

    if (!test) {
      return apiResponse.error('测试题库不存在', 404)
    }

    // 获取词汇详情
    const vocabularies = await prisma.vocabularies.findMany({
      where: {
        id: { in: test.vocabularyIds }
      },
      select: {
        id: true,
        word: true,
        primary_meaning: true,
        difficulty: true
      }
    })

    return apiResponse.success({
      ...test,
      vocabularies
    })
  } catch (error: any) {
    console.error('获取测试题库详情失败:', error)
    return apiResponse.error(`获取测试题库详情失败: ${error?.message || '未知错误'}`)
  }
}

// PUT /api/proficiency-tests/[id] - 更新测试题库
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const { id } = params
    const body = await request.json()
    const {
      name,
      description,
      vocabularyIds,
      passScore,
      duration,
      isActive
    } = body

    // 检查测试题库是否存在
    const existingTest = await prisma.proficiency_tests.findUnique({
      where: { id }
    })

    if (!existingTest) {
      return apiResponse.error('测试题库不存在', 404)
    }

    // 如果更新了词汇列表，验证词汇ID是否存在
    if (vocabularyIds && Array.isArray(vocabularyIds)) {
      const vocabularies = await prisma.vocabularies.findMany({
        where: {
          id: { in: vocabularyIds }
        }
      })

      if (vocabularies.length !== vocabularyIds.length) {
        return apiResponse.error('部分词汇ID不存在', 400)
      }
    }

    // 更新测试题库
    const updateData: any = {
      updatedAt: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (vocabularyIds !== undefined) {
      updateData.vocabularyIds = vocabularyIds
      updateData.totalWords = vocabularyIds.length
    }
    if (passScore !== undefined) updateData.passScore = passScore
    if (duration !== undefined) updateData.duration = duration
    if (isActive !== undefined) updateData.isActive = isActive

    const test = await prisma.proficiency_tests.update({
      where: { id },
      data: updateData
    })

    return apiResponse.success({
      message: '测试题库更新成功',
      test
    })
  } catch (error: any) {
    console.error('更新测试题库失败:', error)
    return apiResponse.error(`更新测试题库失败: ${error?.message || '未知错误'}`)
  }
}

// DELETE /api/proficiency-tests/[id] - 删除测试题库
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return apiResponse.unauthorized('未授权')
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiResponse.unauthorized('Token无效')
    }

    const { id } = params

    // 检查测试题库是否存在
    const existingTest = await prisma.proficiency_tests.findUnique({
      where: { id },
      include: {
        _count: {
          select: { test_records: true }
        }
      }
    })

    if (!existingTest) {
      return apiResponse.error('测试题库不存在', 404)
    }

    // 如果有测试记录，不允许删除
    if (existingTest._count.test_records > 0) {
      return apiResponse.error('该测试题库已有测试记录，不允许删除。可以将其设置为不启用状态。', 400)
    }

    // 删除测试题库
    await prisma.proficiency_tests.delete({
      where: { id }
    })

    return apiResponse.success({
      message: '测试题库删除成功'
    })
  } catch (error: any) {
    console.error('删除测试题库失败:', error)
    return apiResponse.error(`删除测试题库失败: ${error?.message || '未知错误'}`)
  }
}
