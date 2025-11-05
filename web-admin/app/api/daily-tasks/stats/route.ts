import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import { allocateQuestionTypes, getQuestionTypeStats } from '@/lib/question-type-allocator'

/**
 * 获取题型分配统计
 * GET /api/daily-tasks/stats?count=20
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader || '')
    
    if (!token || !verifyToken(token)) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const count = parseInt(searchParams.get('count') || '20')

    // 模拟生成指定数量的词汇ID
    const mockVocabularyIds = Array.from({ length: count }, (_, i) => `vocab-${i}`)
    
    // 分配题型
    const allocation = allocateQuestionTypes(mockVocabularyIds)
    const stats = getQuestionTypeStats(allocation)

    return successResponse({
      ...stats,
      explanation: {
        choiceTypes: {
          englishToChinese: '英选汉',
          chineseToEnglish: '汉选英',
          listening: '听音选词',
        },
        fillInBlank: '选词填空',
        distribution: `选择题 ${stats.choicePercentage.toFixed(1)}% | 选词填空 ${stats.fillInBlankPercentage.toFixed(1)}%`,
      },
    })
  } catch (error: any) {
    console.error('获取题型统计错误:', error)
    return errorResponse(`获取题型统计失败: ${error?.message || '未知错误'}`, 500)
  }
}
