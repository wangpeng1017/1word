import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * @file word-mastery-detail/route.ts
 * @desc 单词掌握详情 API，展示每个单词的累计错误次数和最近3次正确率
 * @see PRD: docs/statistics/PRD.md#单词掌握数据
 */

/**
 * 获取单词掌握详情列表
 * GET /api/statistics/word-mastery-detail?classId=xxx&studentId=xxx&startDate=xxx&endDate=xxx&page=1&pageSize=20&sortBy=wrongCount&sortOrder=desc
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
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
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

        // 构建日期筛选条件
        const dateFilter: any = {}
        if (startDate) {
            dateFilter.gte = new Date(startDate)
        }
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            dateFilter.lte = end
        }
        const hasDateFilter = Object.keys(dateFilter).length > 0

        // 1. 获取词汇列表（分页）
        const vocabularies = await prisma.vocabularies.findMany({
            select: {
                id: true,
                word: true,
                primary_meaning: true,
                phonetic: true,
                phonetic_us: true,
                difficulty: true,
            },
            orderBy: { word: 'asc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

        const vocabularyIds = vocabularies.map(v => v.id)

        // 2. 获取 wrong_questions 数据（累计错误次数）
        const wrongQuestions = await prisma.wrong_questions.findMany({
            where: {
                vocabularyId: { in: vocabularyIds },
                students: Object.keys(studentFilter).length > 0 ? studentFilter : undefined,
                wrongAt: hasDateFilter ? dateFilter : undefined,
            },
            select: {
                vocabularyId: true,
                studentId: true,
            },
        })

        // 按词汇聚合错误次数
        const wrongCountMap = new Map<string, { count: number; students: Set<string> }>()
        wrongQuestions.forEach((wq) => {
            const existing = wrongCountMap.get(wq.vocabularyId)
            if (existing) {
                existing.count += 1
                existing.students.add(wq.studentId)
            } else {
                wrongCountMap.set(wq.vocabularyId, {
                    count: 1,
                    students: new Set([wq.studentId]),
                })
            }
        })

        // 3. 从 study_plans 获取学习记录，计算每个单词的正确率
        // study_plans 包含 reviewCount（复习次数）
        const studyPlans = await prisma.study_plans.findMany({
            where: {
                vocabularyId: { in: vocabularyIds },
                students: Object.keys(studentFilter).length > 0 ? studentFilter : undefined,
            },
            select: {
                vocabularyId: true,
                reviewCount: true,
                status: true,
            },
        })

        // 聚合每个词汇的复习情况
        const studyMap = new Map<string, { totalReviews: number; studentCount: number }>()
        studyPlans.forEach((sp) => {
            const existing = studyMap.get(sp.vocabularyId)
            if (existing) {
                existing.totalReviews += sp.reviewCount
                existing.studentCount += 1
            } else {
                studyMap.set(sp.vocabularyId, {
                    totalReviews: sp.reviewCount,
                    studentCount: 1,
                })
            }
        })

        // 4. 组装返回数据
        const words = vocabularies.map((vocab) => {
            const wrongData = wrongCountMap.get(vocab.id)
            const studyData = studyMap.get(vocab.id)

            // 计算正确率：(总复习次数 - 错误次数) / 总复习次数
            // 如果没有复习记录，则显示为 null
            const totalReviews = studyData?.totalReviews || 0
            const wrongCount = wrongData?.count || 0
            const recentAccuracy = totalReviews > 0
                ? Number((((totalReviews - wrongCount) / totalReviews) * 100).toFixed(1))
                : null

            return {
                vocabularyId: vocab.id,
                word: vocab.word,
                meaning: vocab.primary_meaning,
                phonetic: vocab.phonetic_us || vocab.phonetic || null,
                difficulty: vocab.difficulty,
                totalWrongCount: wrongCount,
                recentAccuracy,
                practiceStudentCount: studyData?.studentCount || wrongData?.students.size || 0,
            }
        })

        // 5. 排序
        words.sort((a, b) => {
            const aVal = sortBy === 'wrongCount' ? a.totalWrongCount : (a.recentAccuracy ?? -1)
            const bVal = sortBy === 'wrongCount' ? b.totalWrongCount : (b.recentAccuracy ?? -1)
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
