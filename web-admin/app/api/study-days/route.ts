/**
 * @file route.ts
 * @desc 学习天数API - 基于当前激活计划获取学生学习天数和进度数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

        // 1. 获取学生信息和班级
        const student = await prisma.students.findUnique({
            where: { id: studentId },
            select: { id: true, class_id: true }
        })

        if (!student || !student.class_id) {
            return NextResponse.json({
                success: true,
                data: { currentDay: 0, streak: 0, totalDays: 0, days: [] }
            })
        }

        // 2. 获取班级的活跃学习计划
        const planClass = await prisma.plan_classes.findFirst({
            where: {
                class_id: student.class_id,
                status: 'ACTIVE'
            },
            include: {
                vocabulary_packs: true
            }
        })

        if (!planClass) {
            return NextResponse.json({
                success: true,
                data: { currentDay: 0, streak: 0, totalDays: 0, days: [] }
            })
        }

        const totalDays = planClass.vocabulary_packs?.totalDays || 10
        const startDate = new Date(planClass.start_date)

        // 3. 获取学生在计划期间的学习记录
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + totalDays)

        const studyRecords = await prisma.study_records.findMany({
            where: {
                studentId,
                taskDate: { gte: startDate, lte: endDate },
                isCompleted: true,
            },
            select: {
                taskDate: true,
                completedWords: true,
                accuracy: true,
                totalTime: true,
            },
        })

        // 按日期分组
        const recordMap = new Map<string, any>()
        studyRecords.forEach((record) => {
            const dateStr = new Date(record.taskDate).toISOString().split('T')[0]
            if (!recordMap.has(dateStr)) {
                recordMap.set(dateStr, {
                    wordsCount: record.completedWords || 0,
                    accuracy: record.accuracy || 0,
                    totalTime: record.totalTime || 0,
                })
            } else {
                const existing = recordMap.get(dateStr)
                existing.wordsCount += record.completedWords || 0
                existing.totalTime += record.totalTime || 0
                existing.accuracy = (existing.accuracy + (record.accuracy || 0)) / 2
            }
        })

        // 4. 生成 DAY 列表
        const today = new Date().toISOString().split('T')[0]
        const days = []
        let streak = 0
        let lastCompletedDate: string | null = null

        for (let i = 0; i < totalDays; i++) {
            const dayNumber = i + 1
            const targetDate = new Date(startDate)
            targetDate.setDate(targetDate.getDate() + i)
            const dateStr = targetDate.toISOString().split('T')[0]

            const dayData = recordMap.get(dateStr)
            let status = 'locked'

            if (dayData) {
                status = 'completed'
                // 计算连续天数
                if (!lastCompletedDate) {
                    streak = 1
                } else {
                    const lastDate = new Date(lastCompletedDate)
                    const currentDate = new Date(dateStr)
                    const diff = (currentDate.getTime() - lastDate.getTime()) / 86400000
                    if (diff === 1) {
                        streak++
                    } else {
                        streak = 1
                    }
                }
                lastCompletedDate = dateStr
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
                accuracy: Math.round((dayData?.accuracy || 0) * 100),
                totalTime: dayData?.totalTime || 0,
            })
        }

        // 找到当前天数
        const currentDayIndex = days.findIndex(d => d.status === 'current' || d.status === 'locked')

        return NextResponse.json({
            success: true,
            data: {
                currentDay: currentDayIndex >= 0 ? currentDayIndex + 1 : days.length,
                streak,
                totalDays,
                packName: planClass.vocabulary_packs?.name || '',
                startDate: startDate.toISOString().split('T')[0],
                days,
            },
        })
    } catch (error) {
        console.error('[API] 获取学习天数失败:', error)
        return NextResponse.json(
            { success: false, error: '获取学习天数失败' },
            { status: 500 }
        )
    }
}
