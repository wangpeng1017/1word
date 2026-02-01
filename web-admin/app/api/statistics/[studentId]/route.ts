import { NextRequest } from 'next/server'
import { prismaRead } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'

/**
 * 获取学生个人统计数据
 * GET /api/statistics/[studentId]?period=week
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ studentId: string }> }
) {
    const params = await context.params
    try {
        const authHeader = request.headers.get('authorization')
        const token = getTokenFromHeader(authHeader || '')

        if (!token || !verifyToken(token)) {
            return unauthorizedResponse()
        }

        const { studentId } = params
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || 'week'
        const customStart = searchParams.get('startDate')
        const customEnd = searchParams.get('endDate')

        // 计算时间范围
        const { startDate, endDate } = getDateRange(period, customStart, customEnd)

        // 1. 获取学生信息
        const student = await prismaRead.students.findUnique({
            where: { id: studentId },
            include: {
                user: { select: { name: true } },
            },
        })

        if (!student) {
            return errorResponse('学生不存在', 404)
        }

        // 2. 获取学习记录统计
        const studyRecords = await prismaRead.study_records.findMany({
            where: {
                studentId,
                taskDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { taskDate: 'asc' },
        })

        // 计算总体统计
        const totalQuestions = studyRecords.reduce((sum, r) => sum + r.totalWords, 0)
        const correctCount = studyRecords.reduce((sum, r) => sum + r.correctCount, 0)
        const wrongCount = studyRecords.reduce((sum, r) => sum + r.wrongCount, 0)
        const totalTimeSeconds = studyRecords.reduce((sum, r) => sum + r.totalTime, 0)
        const accuracy = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0

        // 3. 获取错题词性分布
        const wrongQuestions = await prismaRead.wrong_questions.findMany({
            where: {
                studentId,
                wrongAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                vocabularies: {
                    include: {
                        word_meanings: {
                            where: { orderIndex: 0 },
                            take: 1,
                        },
                    },
                },
            },
        })

        // 统计词性分布（优先使用word_meanings，回退到part_of_speech）
        const posStats: Record<string, number> = {}
        wrongQuestions.forEach((wq) => {
            const vocab = wq.vocabularies as any
            let pos = 'unknown'

            if (vocab.word_meanings && vocab.word_meanings.length > 0) {
                pos = vocab.word_meanings[0].partOfSpeech
            } else if (vocab.part_of_speech && vocab.part_of_speech.length > 0) {
                pos = vocab.part_of_speech[0]
            }

            posStats[pos] = (posStats[pos] || 0) + 1
        })

        // 4. 趋势数据
        const trendData = studyRecords.map((r) => ({
            date: r.taskDate.toISOString().split('T')[0],
            questions: r.totalWords,
            accuracy: Number((r.accuracy * 100).toFixed(1)),
            timeSeconds: r.totalTime,
        }))

        // 5. 高频错词 Top 10
        const wrongWordStats = new Map<string, { count: number; vocab: any }>()
        wrongQuestions.forEach((wq) => {
            const vocab = wq.vocabularies
            const key = vocab.id
            if (!wrongWordStats.has(key)) {
                wrongWordStats.set(key, { count: 0, vocab })
            }
            wrongWordStats.get(key)!.count++
        })

        const topWrongWords = Array.from(wrongWordStats.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map((item) => {
                const vocab = item.vocab as any
                let pos = 'unknown'
                if (vocab.word_meanings && vocab.word_meanings.length > 0) {
                    pos = vocab.word_meanings[0].partOfSpeech
                } else if (vocab.part_of_speech && vocab.part_of_speech.length > 0) {
                    pos = vocab.part_of_speech[0]
                }

                return {
                    word: vocab.word,
                    meaning: vocab.primary_meaning,
                    wrongCount: item.count,
                    partOfSpeech: pos,
                }
            })

        return successResponse({
            student: {
                id: student.id,
                name: student.user.name,
                studentNo: student.student_no,
            },
            period: {
                type: period,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            },
            overview: {
                totalQuestions,
                correctCount,
                wrongCount,
                accuracy,
                totalTimeSeconds,
            },
            partOfSpeechStats: posStats,
            trendData,
            topWrongWords,
        })
    } catch (error) {
        console.error('获取学生统计数据错误:', error)
        return errorResponse('获取统计数据失败', 500)
    }
}

/**
 * 根据period计算日期范围
 */
function getDateRange(
    period: string,
    customStart?: string | null,
    customEnd?: string | null
): { startDate: Date; endDate: Date } {
    const now = new Date()
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    let startDate: Date

    if (customStart && customEnd) {
        startDate = new Date(customStart)
        return { startDate, endDate: new Date(customEnd) }
    }

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
            break
        case 'week':
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 7)
            break
        case 'month':
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 30)
            break
        case 'all':
            startDate = new Date('2020-01-01') // 假设系统最早开始时间
            break
        default:
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 7) // 默认一周
    }

    return { startDate, endDate }
}
