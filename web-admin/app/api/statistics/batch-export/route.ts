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
import archiver from 'archiver'
import fs from 'fs'

/**
 * 批量导出学生统计报告
 * POST /api/statistics/batch-export
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = getTokenFromHeader(authHeader || '')

        const payload = verifyToken(token || '')
        if (!payload || payload.role !== 'TEACHER') {
            return unauthorizedResponse('只有教师可以批量导出报告')
        }

        const body = await request.json()
        const { studentIds, format = 'pdf', period = 'week', classId } = body

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return errorResponse('请选择要导出的学生', 400)
        }

        if (!['pdf', 'word'].includes(format)) {
            return errorResponse('无效的导出格式', 400)
        }

        // 确保导出目录存在
        const exportDir = ensureExportDir()
        const timestamp = Date.now()
        const zipFileName = `batch_reports_${timestamp}.zip`
        const zipPath = path.join(exportDir, zipFileName)

        // 创建ZIP文件
        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        archive.pipe(output)

        let successCount = 0
        let failedStudents: string[] = []

        // 为每个学生生成报告
        for (const studentId of studentIds) {
            try {
                const reportData = await getReportData(studentId, period)
                if (!reportData) {
                    failedStudents.push(studentId)
                    continue
                }

                const fileName = `${reportData.student.studentNo}_${reportData.student.name}_学习报告.${format === 'pdf' ? 'pdf' : 'docx'}`
                const tempFilePath = path.join(exportDir, `temp_${studentId}_${timestamp}.${format === 'pdf' ? 'pdf' : 'docx'}`)

                // 生成报告文件
                if (format === 'pdf') {
                    await generatePDFReport(reportData, tempFilePath)
                } else {
                    await generateWordReport(reportData, tempFilePath)
                }

                // 添加到ZIP
                archive.file(tempFilePath, { name: fileName })
                successCount++

                // 删除临时文件（在ZIP完成后）
                setTimeout(() => {
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath)
                    }
                }, 5000)
            } catch (error) {
                console.error(`生成学生 ${studentId} 报告失败:`, error)
                failedStudents.push(studentId)
            }
        }

        await archive.finalize()

        // 等待ZIP完成
        await new Promise<void>((resolve, reject) => {
            output.on('close', () => resolve())
            output.on('error', reject)
        })

        const stats = fs.statSync(zipPath)

        return successResponse({
            downloadUrl: `/exports/${zipFileName}`,
            fileName: zipFileName,
            fileSize: stats.size,
            successCount,
            failedCount: failedStudents.length,
            totalCount: studentIds.length,
            failedStudents,
        })
    } catch (error) {
        console.error('批量导出失败:', error)
        return errorResponse('批量导出失败', 500)
    }
}

/**
 * 获取报告数据
 */
async function getReportData(
    studentId: string,
    period: string
): Promise<ReportData | null> {
    try {
        const { startDate, endDate } = getDateRange(period)

        const student = await prisma.students.findUnique({
            where: { id: studentId },
            include: {
                user: { select: { name: true } },
                classes: { select: { grade: true } },
            },
        })

        if (!student) {
            return null
        }

        const studyRecords = await prisma.study_records.findMany({
            where: {
                studentId,
                taskDate: { gte: startDate, lte: endDate },
            },
        })

        const totalQuestions = studyRecords.reduce((sum, r) => sum + r.totalWords, 0)
        const correctCount = studyRecords.reduce((sum, r) => sum + r.correctCount, 0)
        const wrongCount = studyRecords.reduce((sum, r) => sum + r.wrongCount, 0)
        const totalTimeSeconds = studyRecords.reduce((sum, r) => sum + r.totalTime, 0)
        const accuracy = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0

        const wrongQuestions = await prisma.wrong_questions.findMany({
            where: {
                studentId,
                wrongAt: { gte: startDate, lte: endDate },
            },
            include: {
                vocabularies: {
                    include: {
                        word_meanings: { where: { orderIndex: 0 }, take: 1 },
                    },
                },
            },
        })

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
                grade: student.classes?.grade,
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

function getDateRange(period: string): { startDate: Date; endDate: Date } {
    const now = new Date()
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    let startDate: Date

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
