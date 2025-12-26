import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * @file word-mastery-detail/route.ts
 * @desc 单词掌握详情 API，展示每个单词的累计错误次数和最近3次复习正确率
 * @see PRD: docs/statistics/PRD.md#单词掌握数据
 */

/**
 * 获取单词掌握详情列表
 * GET /api/statistics/word-mastery-detail?classId=xxx&studentId=xxx&page=1&pageSize=20&sortBy=wrongCount&sortOrder=desc
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = getTokenFromHeader(authHeader || '')

        const payload = verifyToken(token || '')
        if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
            return unauthorizedResponse('只有教师或管理员可以查看单词掌握数据')
        }

        const { searchParams } = new URL(request.url)
        const classId = searchParams.get('classId')
        const studentId = searchParams.get('studentId')
        const page = parseInt(searchParams.get('page') || '1', 10)
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
        const sortBy = searchParams.get('sortBy') || 'wrongCount' // wrongCount | recentAccuracy
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        // 构建学生筛选条件
        const studentFilter: any = {}
        if (classId) {
            studentFilter.class_id = classId
        }
        if (studentId) {
            studentFilter.id = studentId
        }

        // 1. 获取词汇列表（分页）
        const vocabularies = await prisma.vocabularies.findMany({
            select: {
                id: true,
                word: true,
                primary_meaning: true,
                phonetic: true,
                phonetic_us: true,
            },
            orderBy: { word: 'asc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

        const vocabularyIds = vocabularies.map(v => v.id)

        // 2. 获取 word_masteries 数据（累计错误次数）
        const masteries = await prisma.word_masteries.findMany({
            where: {
                vocabularyId: { in: vocabularyIds },
                students: Object.keys(studentFilter).length > 0 ? studentFilter : undefined,
            },
            select: {
                vocabularyId: true,
                totalWrongCount: true,
                studentId: true,
            },
        })

        // 按词汇聚合错误次数
        const masteryMap = new Map<string, { totalWrongCount: number; studentCount: number }>()
        masteries.forEach((m) => {
            const existing = masteryMap.get(m.vocabularyId)
            if (existing) {
                existing.totalWrongCount += m.totalWrongCount
                existing.studentCount += 1
            } else {
                masteryMap.set(m.vocabularyId, {
                    totalWrongCount: m.totalWrongCount,
                    studentCount: 1,
                })
            }
        })

        // 3. 获取最近的答题记录（每个词汇取最近3次）
        const recentAnswers = await prisma.question_answers.findMany({
            where: {
                vocabularyId: { in: vocabularyIds },
                students: Object.keys(studentFilter).length > 0 ? studentFilter : undefined,
            },
            select: {
                vocabularyId: true,
                isCorrect: true,
                answeredAt: true,
            },
            orderBy: { answeredAt: 'desc' },
        })

        // 按词汇分组，取最近3次
        const recentAnswersMap = new Map<string, Array<{ isCorrect: boolean; answeredAt: Date }>>()
        recentAnswers.forEach((a) => {
            const existing = recentAnswersMap.get(a.vocabularyId) || []
            if (existing.length < 3) {
                existing.push({ isCorrect: a.isCorrect, answeredAt: a.answeredAt })
                recentAnswersMap.set(a.vocabularyId, existing)
            }
        })

        // 4. 组装返回数据
        const words = vocabularies.map((vocab) => {
            const mastery = masteryMap.get(vocab.id)
            const recent = recentAnswersMap.get(vocab.id) || []

            // 计算最近3次正确率
            const recentCorrectCount = recent.filter(a => a.isCorrect).length
            const recentAccuracy = recent.length > 0
                ? Number(((recentCorrectCount / recent.length) * 100).toFixed(1))
                : null

            return {
                vocabularyId: vocab.id,
                word: vocab.word,
                meaning: vocab.primary_meaning,
                phonetic: vocab.phonetic_us || vocab.phonetic || null,
                totalWrongCount: mastery?.totalWrongCount || 0,
                recentAccuracy,
                recentAnswers: recent.map(a => ({
                    isCorrect: a.isCorrect,
                    answeredAt: a.answeredAt.toISOString(),
                })),
                studentCount: mastery?.studentCount || 0,
            }
        })

        // 5. 排序
        words.sort((a, b) => {
            const aVal = sortBy === 'wrongCount' ? a.totalWrongCount : (a.recentAccuracy ?? 0)
            const bVal = sortBy === 'wrongCount' ? b.totalWrongCount : (b.recentAccuracy ?? 0)
            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
        })

        // 获取总数
        const total = await prisma.vocabularies.count()

        return successResponse({
            words,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        })
    } catch (error) {
        console.error('获取单词掌握详情错误:', error)
        return errorResponse('获取单词掌握数据失败', 500)
    }
}
