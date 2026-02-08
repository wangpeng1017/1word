import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { apiResponse } from '@/lib/response'

// GET /api/word-mastery - 获取单词掌握数据
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
        const classId = searchParams.get('classId')
        const studentId = searchParams.get('studentId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const sortBy = searchParams.get('sortBy') || 'wrongCount' // wrongCount | word | accuracy
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        // 构建查询条件
        const studentFilter: any = {}
        if (studentId) {
            studentFilter.studentId = studentId
        } else if (classId) {
            // 获取班级下所有学生ID
            const studentsInClass = await prisma.students.findMany({
                where: { class_id: classId },
                select: { id: true }
            })
            studentFilter.studentId = { in: studentsInClass.map(s => s.id) }
        }

        // 获取所有单词掌握记录（聚合）
        const wordMasteryData = await prisma.word_masteries.findMany({
            where: studentFilter,
            include: {
                vocabularies: {
                    select: {
                        id: true,
                        word: true,
                        primary_meaning: true,
                        phonetic: true,
                        difficulty: true,
                    }
                },
                students: {
                    select: {
                        id: true,
                        user: { select: { name: true } },
                        classes: { select: { name: true } }
                    }
                }
            }
        })

        // 聚合统计数据
        const aggregatedData = new Map<string, {
            vocabularyId: string
            word: string
            meaning: string
            phonetic: string | null
            difficulty: string
            totalWrongCount: number
            practiceCount: number
            studentCount: number
            avgConsecutiveCorrect: number
            masteredCount: number
            difficultCount: number
            recentAccuracy: number | null
            studentIds: string[]  // 收集学生ID用于后续查询
        }>()

        for (const record of wordMasteryData) {
            const vocabId = record.vocabularyId
            const existing = aggregatedData.get(vocabId)

            if (existing) {
                existing.totalWrongCount += record.totalWrongCount
                existing.practiceCount += 1
                existing.studentCount += 1
                existing.avgConsecutiveCorrect += record.consecutiveCorrect
                if (record.isMastered) existing.masteredCount += 1
                if (record.isDifficult) existing.difficultCount += 1
                existing.studentIds.push(record.studentId)
            } else {
                aggregatedData.set(vocabId, {
                    vocabularyId: vocabId,
                    word: record.vocabularies.word,
                    meaning: record.vocabularies.primary_meaning,
                    phonetic: record.vocabularies.phonetic,
                    difficulty: record.vocabularies.difficulty,
                    totalWrongCount: record.totalWrongCount,
                    practiceCount: 1,
                    studentCount: 1,
                    avgConsecutiveCorrect: record.consecutiveCorrect,
                    masteredCount: record.isMastered ? 1 : 0,
                    difficultCount: record.isDifficult ? 1 : 0,
                    recentAccuracy: null,  // 稍后从 question_answers 计算
                    studentIds: [record.studentId],
                })
            }
        }

        // 从 question_answers 表批量查询最近答题记录（一次查询替代 N 次）
        const vocabIds = Array.from(aggregatedData.keys())
        const allStudentIds = [...new Set(
            Array.from(aggregatedData.values()).flatMap(item => item.studentIds)
        )]

        // 一次性查出所有相关的最近答题记录
        const allRecentAnswers = await prisma.question_answers.findMany({
            where: {
                vocabularyId: { in: vocabIds },
                studentId: { in: allStudentIds },
            },
            orderBy: { answeredAt: 'desc' },
            select: { vocabularyId: true, isCorrect: true }
        })

        // 按 vocabularyId 分组，取每组前 3 条
        const answersByVocab = new Map<string, boolean[]>()
        for (const answer of allRecentAnswers) {
            const list = answersByVocab.get(answer.vocabularyId) || []
            if (list.length < 3) {
                list.push(answer.isCorrect)
                answersByVocab.set(answer.vocabularyId, list)
            }
        }

        // 计算每个词汇的最近正确率
        for (const vocabId of vocabIds) {
            const item = aggregatedData.get(vocabId)!
            const recent = answersByVocab.get(vocabId) || []
            if (recent.length > 0) {
                const correctCount = recent.filter(r => r).length
                item.recentAccuracy = Math.round((correctCount / recent.length) * 100)
            }
        }

        // 转换为数组并排序（排除 studentIds 字段）
        let result = Array.from(aggregatedData.values()).map(({ studentIds, ...rest }) => rest)

        // 计算平均值
        result = result.map(item => ({
            ...item,
            avgConsecutiveCorrect: item.studentCount > 0
                ? Math.round(item.avgConsecutiveCorrect / item.studentCount * 10) / 10
                : 0
        }))

        // 排序
        result.sort((a, b) => {
            let compareValue = 0
            switch (sortBy) {
                case 'wrongCount':
                    compareValue = a.totalWrongCount - b.totalWrongCount
                    break
                case 'word':
                    compareValue = a.word.localeCompare(b.word)
                    break
                case 'accuracy':
                    compareValue = (a.recentAccuracy || 0) - (b.recentAccuracy || 0)
                    break
                case 'difficulty':
                    const diffOrder = { EASY: 1, MEDIUM: 2, HARD: 3 }
                    compareValue = (diffOrder[a.difficulty as keyof typeof diffOrder] || 2) -
                        (diffOrder[b.difficulty as keyof typeof diffOrder] || 2)
                    break
                default:
                    compareValue = a.totalWrongCount - b.totalWrongCount
            }
            return sortOrder === 'desc' ? -compareValue : compareValue
        })

        // 分页
        const total = result.length
        const startIndex = (page - 1) * limit
        const paginatedResult = result.slice(startIndex, startIndex + limit)

        return apiResponse.success({
            records: paginatedResult,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error: any) {
        console.error('获取单词掌握数据失败:', error)
        return apiResponse.error(`获取单词掌握数据失败: ${error?.message || '未知错误'}`)
    }
}
