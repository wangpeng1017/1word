/**
 * @file route.ts
 * @desc 学习天数API - 获取学生学习天数和进度数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/study-days?studentId=xxx - 获取学生学习天数数据
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('studentId')

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: '缺少学生ID' },
                { status: 400 }
            )
        }

        // 获取学生的学习记录
        const studyRecords = await prisma.study_records.findMany({
            where: {
                studentId,
                isCompleted: true,
            },
            orderBy: {
                taskDate: 'asc',
            },
            select: {
                taskDate: true,
                totalWords: true,
                completedWords: true,
                accuracy: true,
                totalTime: true,
            },
        })

        if (studyRecords.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    currentDay: 0,
                    streak: 0,
                    totalDays: 0,
                    days: [],
                },
            })
        }

        // 按日期分组统计
        const dayMap = new Map()
        studyRecords.forEach((record) => {
            const dateStr = new Date(record.taskDate).toISOString().split('T')[0]
            if (!dayMap.has(dateStr)) {
                dayMap.set(dateStr, {
                    date: dateStr,
                    wordsCount: record.completedWords || 0,
                    accuracy: record.accuracy || 0,
                    totalTime: record.totalTime || 0,
                })
            } else {
                // 如果同一天有多条记录,累加数据
                const existing = dayMap.get(dateStr)
                existing.wordsCount += record.completedWords || 0
                existing.totalTime += record.totalTime || 0
                // 准确率取平均
                existing.accuracy = (existing.accuracy + (record.accuracy || 0)) / 2
            }
        })

        // 转换为数组并排序
        const sortedDays = Array.from(dayMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, data]) => ({ date, ...data }))

        // 计算连续学习天数
        let streak = 0
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        // 从最后一天往前计算连续天数
        for (let i = sortedDays.length - 1; i >= 0; i--) {
            const currentDate = sortedDays[i].date

            if (i === sortedDays.length - 1) {
                // 最后一天必须是今天或昨天
                if (currentDate === today || currentDate === yesterday) {
                    streak = 1
                } else {
                    break
                }
            } else {
                const nextDate = sortedDays[i + 1].date
                const dayDiff = Math.floor(
                    (new Date(nextDate).getTime() - new Date(currentDate).getTime()) / 86400000
                )

                if (dayDiff === 1) {
                    streak++
                } else {
                    break
                }
            }
        }

        // 生成 DAY1-DAY10 的数据
        const days = []
        const startDate = sortedDays[0]?.date || today

        for (let i = 0; i < 10; i++) {
            const dayNumber = i + 1
            const targetDate = new Date(startDate)
            targetDate.setDate(targetDate.getDate() + i)
            const dateStr = targetDate.toISOString().split('T')[0]

            const dayData = sortedDays.find(d => d.date === dateStr)

            let status = 'locked'
            if (dayData) {
                status = 'completed'
            } else if (dateStr === today) {
                status = 'current'
            } else if (dateStr < today) {
                status = 'missed'
            }

            days.push({
                day: dayNumber,
                date: dateStr,
                status,
                wordsCount: dayData?.wordsCount || 0,
                accuracy: dayData?.accuracy || 0,
                totalTime: dayData?.totalTime || 0,
            })
        }

        // 找到当前天数
        const currentDay = days.findIndex(d => d.status === 'current' || d.status === 'locked')

        return NextResponse.json({
            success: true,
            data: {
                currentDay: currentDay >= 0 ? currentDay + 1 : days.length,
                streak,
                totalDays: sortedDays.length,
                days,
            },
        })
    } catch (error) {
        console.error('[API] 获取学习天数失败:', error)
        return NextResponse.json(
            {
                success: false,
                error: '获取学习天数失败',
            },
            { status: 500 }
        )
    }
}
