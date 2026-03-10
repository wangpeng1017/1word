/**
 * @file review-schedule.js
 * @desc 91天复习课表引擎 — 动态生成任意天数词汇包的复习计划
 * 逻辑从 web-admin/lib/review-schedule.ts 迁移
 */

/** 总计划天数（固定91天） */
export const TOTAL_PLAN_DAYS = 91

/**
 * 从 pack_days 中提取有效课程映射
 * @param packDays 词汇包的所有天（含空天）
 * @returns Map<lessonIndex(1-based), dayNumber>
 */
export function getEffectiveLessons(packDays) {
    const map = new Map()
    let lessonIndex = 1
    const sorted = [...packDays].sort((a, b) => a.dayNumber - b.dayNumber)
    for (const day of sorted) {
        if (day.day_words && day.day_words.length > 0) {
            map.set(lessonIndex++, day.dayNumber)
        }
    }
    return map
}

/**
 * 获取当天（学习期内）应复习的有效课程序号列表
 * @param currentLessonIndex 今天正在学习的有效课程序号（1-based）
 */
export function getLearningPeriodReview(currentLessonIndex) {
    if (currentLessonIndex <= 0) return []

    const reviews = new Set()

    // 当天复习
    reviews.add(currentLessonIndex)

    // 前一课复习
    if (currentLessonIndex >= 2) {
        reviews.add(currentLessonIndex - 1)
    }

    // 第一轮全面复习：从第 4 课开始，复习 lesson - 3
    if (currentLessonIndex >= 4) {
        reviews.add(currentLessonIndex - 3)
    }

    return Array.from(reviews).sort((a, b) => a - b)
}

/**
 * 生成学习期结束后（DAY totalDays+1 到 DAY 91）的完整复习课表
 */
export function generatePostLearningSchedule(totalLessons, totalDays) {
    const schedule = []
    const remainingDays = TOTAL_PLAN_DAYS - totalDays
    if (remainingDays <= 0) return schedule

    let dayOffset = 0
    const addDay = (type, reviewLessons) => {
        if (dayOffset >= remainingDays) return
        schedule.push({
            dayNumber: totalDays + 1 + dayOffset,
            type,
            reviewLessons,
        })
        dayOffset++
    }

    const allLessons = Array.from({ length: totalLessons }, (_, i) => i + 1)

    // Phase 2：抗遗忘 (4天)
    const antiForgetDays = Math.min(4, remainingDays)
    const firstRoundRemaining = []
    for (let i = Math.max(1, totalLessons - 2); i <= totalLessons; i++) {
        firstRoundRemaining.push(i)
    }

    for (let d = 0; d < antiForgetDays; d++) {
        const lessons = new Set()
        if (d < firstRoundRemaining.length) {
            lessons.add(firstRoundRemaining[d])
        }
        for (let i = d; i < totalLessons; i += antiForgetDays) {
            lessons.add(i + 1)
        }
        addDay('review', Array.from(lessons).sort((a, b) => a - b))
    }

    // Phase 3：第二轮全面复习
    for (let i = 0; i < totalLessons && dayOffset < remainingDays; i++) {
        addDay('review', [i + 1])
    }

    const daysUsed = dayOffset
    const daysLeft = remainingDays - daysUsed

    // 第三轮需要 N 天 + 综合检测需要 2 天
    const thirdRoundNeeded = totalLessons
    const testsNeeded = 2
    const restBudget = daysLeft - thirdRoundNeeded - testsNeeded

    if (restBudget >= 0) {
        const restBeforeThird = Math.min(5, Math.floor(restBudget * 0.2))
        const restAfterThird = restBudget - restBeforeThird

        for (let i = 0; i < restBeforeThird; i++) addDay('rest', [])

        for (let i = 0; i < totalLessons && dayOffset < remainingDays; i++) {
            addDay('review', [i + 1])
        }

        const afterThirdLeft = remainingDays - dayOffset
        if (afterThirdLeft >= 2) {
            const restBeforeTest1 = Math.max(0, Math.floor((afterThirdLeft - 2) * 0.3))
            for (let i = 0; i < restBeforeTest1; i++) addDay('rest', [])
            addDay('test', allLessons)

            const afterTest1Left = remainingDays - dayOffset
            if (afterTest1Left >= 2) {
                const restBeforeTest2 = afterTest1Left - 1
                for (let i = 0; i < restBeforeTest2; i++) addDay('rest', [])
                addDay('test', allLessons)
            } else {
                while (dayOffset < remainingDays) addDay('rest', [])
            }
        } else {
            while (dayOffset < remainingDays) addDay('rest', [])
        }
    } else {
        let lessonIdx = 0
        while (dayOffset < remainingDays - 1) {
            addDay('review', [allLessons[lessonIdx % totalLessons]])
            lessonIdx++
        }
        if (dayOffset < remainingDays) {
            addDay('test', allLessons)
        }
    }

    return schedule
}

/**
 * 获取某一天应该复习的有效课程序号列表
 */
export function getDayScheduleInfo(dayNumber, totalDays, totalLessons, currentLessonForDay = 0) {
    if (dayNumber >= 1 && dayNumber <= totalDays) {
        if (currentLessonForDay > 0) {
            return {
                type: 'learn',
                reviewLessons: getLearningPeriodReview(currentLessonForDay),
            }
        }
        return { type: 'rest', reviewLessons: [] }
    }

    const postSchedule = generatePostLearningSchedule(totalLessons, totalDays)
    const entry = postSchedule.find(s => s.dayNumber === dayNumber)
    if (entry) {
        return { type: entry.type, reviewLessons: entry.reviewLessons }
    }

    return { type: 'rest', reviewLessons: [] }
}

/**
 * 将有效课程序号列表转为实际的 dayNumber 列表
 */
export function resolveToPackDayNumbers(lessonIndices, lessonMap) {
    const result = []
    for (const idx of lessonIndices) {
        const dn = lessonMap.get(idx)
        if (dn !== undefined) result.push(dn)
    }
    return result
}

/**
 * 获取整个91天每天的课表摘要
 */
export function getFullScheduleSummary(totalDays, totalLessons, lessonMap) {
    const postSchedule = generatePostLearningSchedule(totalLessons, totalDays)
    const postMap = new Map()
    for (const s of postSchedule) postMap.set(s.dayNumber, s)

    const dayToLesson = new Map()
    for (const [li, dn] of lessonMap.entries()) dayToLesson.set(dn, li)

    const summary = []

    for (let day = 1; day <= TOTAL_PLAN_DAYS; day++) {
        if (day <= totalDays) {
            const lessonIdx = dayToLesson.get(day) || 0
            if (lessonIdx > 0) {
                const reviewLessons = getLearningPeriodReview(lessonIdx)
                summary.push({
                    type: 'learn',
                    reviewDayNumbers: resolveToPackDayNumbers(reviewLessons, lessonMap),
                })
            } else {
                summary.push({ type: 'rest', reviewDayNumbers: [] })
            }
        } else {
            const entry = postMap.get(day)
            if (entry) {
                summary.push({
                    type: entry.type,
                    reviewDayNumbers: resolveToPackDayNumbers(entry.reviewLessons, lessonMap),
                })
            } else {
                summary.push({ type: 'rest', reviewDayNumbers: [] })
            }
        }
    }

    return summary
}
