import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/response'
import {
    generatePDFReport,
    generateWordReport,
    ensureExportDir,
    generateFileName,
    type ReportData,
} from '@/lib/report-generator'
import path from 'path'

/**
 * 生成并导出统计报告
 * POST /api/statistics/[studentId]/export
 */
export async function POST(
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
        const body = await request.json()
        const { format, period = 'week', startDate, endDate } = body

        if (!format || !['pdf', 'word'].includes(format)) {
            return errorResponse('无效的导出格式', 400)
        }

        // Vercel环境不支持PDF生成，因为pdfkit需要文件系统字体
        if (format === 'pdf') {
            return errorResponse('当前环境不支持PDF导出，请使用Word格式', 400)
        }

        // 获取统计数据
        const reportData = await getReportData(studentId, period, startDate, endDate)

        if (!reportData) {
            return errorResponse('无法获取统计数据', 500)
        }

        // 确保导出目录存在
        const exportDir = ensureExportDir()
        const fileName = generateFileName(studentId, format)
        const filepath = path.join(exportDir, fileName)

        // 生成报告
        try {
            if (format === 'pdf') {
                await generatePDFReport(reportData, filepath)
            } else {
                await generateWordReport(reportData, filepath)
            }
        } catch (genError) {
            console.error('生成报告失败:', genError)
            return errorResponse('生成报告失败', 500)
        }

        // 返回下载链接
        const downloadUrl = `/api/exports/${fileName}`
        const stats = require('fs').statSync(filepath)

        return successResponse({
            downloadUrl,
            fileName,
            fileSize: stats.size,
        })
    } catch (error) {
        console.error('导出报告错误:', error)
        return errorResponse('导出报告失败', 500)
    }
}

/**
 * 获取报告数据
 */
async function getReportData(
    studentId: string,
    period: string,
    customStart?: string,
    customEnd?: string
): Promise<ReportData | null> {
    try {
        // 计算时间范围
        const { startDate, endDate } = getDateRange(period, customStart, customEnd)

        // 获取学生信息
        const student = await prisma.students.findUnique({
            where: { id: studentId },
            include: {
                user: { select: { name: true } },
                classes: { select: { name: true } },
            },
        })

        if (!student) {
            return null
        }

        // 获取学习记录
        const studyRecords = await prisma.study_records.findMany({
            where: {
                studentId,
                taskDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        // 计算总体统计
        const totalQuestions = studyRecords.reduce((sum, r) => sum + r.totalWords, 0)
        const correctCount = studyRecords.reduce((sum, r) => sum + r.correctCount, 0)
        const wrongCount = studyRecords.reduce((sum, r) => sum + r.wrongCount, 0)
        const totalTimeSeconds = studyRecords.reduce((sum, r) => sum + r.totalTime, 0)
        const accuracy = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0

        // 获取错题词性分布
        const wrongQuestions = await prisma.wrong_questions.findMany({
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

        // 统计词性分布
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

        // 高频错词 Top 10
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

        return {
            student: {
                name: student.user.name,
                studentNo: student.student_no,
                className: student.classes?.name,
            },
            period: {
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
            topWrongWords,
        }
    } catch (error) {
        console.error('获取报告数据失败:', error)
        return null
    }
}

/**
 * 根据period计算日期范围
 */
function getDateRange(
    period: string,
    customStart?: string,
    customEnd?: string
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
            startDate = new Date('2020-01-01')
            break
        default:
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 7)
    }

    return { startDate, endDate }
}
