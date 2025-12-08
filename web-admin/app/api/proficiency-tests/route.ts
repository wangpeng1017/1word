import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/proficiency-tests - 获取测试题库列表
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
    const isActive = searchParams.get('isActive')
    const createdBy = searchParams.get('createdBy')

    const where: any = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    if (createdBy) {
      where.createdBy = createdBy
    }

    const tests = await prisma.proficiency_tests.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { test_records: true }
        }
      }
    })

    return apiResponse.success(tests)
  } catch (error: any) {
    console.error('获取测试题库失败:', error)
    return apiResponse.error(`获取测试题库失败: ${error?.message || '未知错误'}`)
  }
}

// POST /api/proficiency-tests - 创建测试题库
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
      name,
      description,
      vocabularyIds,
      passScore = 60,
      duration,
      createdBy
    } = body

    // 验证必填字段
    if (!name || !vocabularyIds || !Array.isArray(vocabularyIds) || vocabularyIds.length === 0) {
      return apiResponse.error('参数错误：name和vocabularyIds为必填项', 400)
    }

    if (!createdBy) {
      return apiResponse.error('参数错误：createdBy为必填项', 400)
    }

    // 验证词汇ID是否存在
    const vocabularies = await prisma.vocabularies.findMany({
      where: {
        id: { in: vocabularyIds }
      }
    })

    if (vocabularies.length !== vocabularyIds.length) {
      return apiResponse.error('部分词汇ID不存在', 400)
    }

    // 创建测试题库
    const testId = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const test = await prisma.proficiency_tests.create({
      data: {
        id: testId,
        name,
        description,
        vocabularyIds,
        totalWords: vocabularyIds.length,
        passScore,
        duration,
        createdBy,
        updatedAt: new Date()
      }
    })

    return apiResponse.success({
      message: '测试题库创建成功',
      test
    })
  } catch (error: any) {
    console.error('创建测试题库失败:', error)
    return apiResponse.error(`创建测试题库失败: ${error?.message || '未知错误'}`)
  }
}
