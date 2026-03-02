/**
 * @file review-schedule.ts
 * @desc 91天复习课表引擎 — 动态生成任意天数词汇包的复习计划
 * @see PRD: docs/review-schedule/PRD.md
 *
 * 核心概念：
 * - totalDays: 词汇包的日历天数（含节假日空天）
 * - effectiveLessons: 有效课程数（有实际新词的天数）
 * - lessonIndex: 有效课程序号（1-based），用于课表引用
 * - dayNumber: 日历天编号（1-based），对应 pack_days.dayNumber
 *
 * 91 天课表分为以下阶段：
 * Phase 1: 学习期 (DAY 1 ~ totalDays) — 新词 + 复习
 * Phase 2: 抗遗忘 (4天) — 完成第一轮全面复习 + 间隔强化
 * Phase 3: 第二轮全面复习 (N天，每天1课)
 * Phase 4: 休息
 * Phase 5: 第三轮全面复习 (N天，每天1课)
 * Phase 6: 休息 + 综合检测1
 * Phase 7: 休息 + 综合检测2
 */

/** 总计划天数（固定91天） */
export const TOTAL_PLAN_DAYS = 91

/** Day 类型 */
export type DayType = 'learn' | 'review' | 'test' | 'rest'

/** 单日课表配置 */
export interface DaySchedule {
    dayNumber: number
    type: DayType
    /** 要复习的有效课程序号列表（1-based lessonIndex），运行时通过 lessonMap 转为 dayNumber */
    reviewLessons: number[]
}

/**
 * 从 pack_days 中提取有效课程映射
 * @param packDays 词汇包的所有天（含空天）
 * @returns Map<lessonIndex(1-based), dayNumber>
 *
 * 例如：10天班中 DAY5 是节假日
 * pack_days: [DAY1(30词), DAY2(30词), DAY3(30词), DAY4(30词), DAY5(0词), DAY6(30词), ...]
 * 返回: {1→1, 2→2, 3→3, 4→4, 5→6, 6→7, 7→8, 8→9, 9→10, 10→11}
 */
export function getEffectiveLessons(
    packDays: Array<{ dayNumber: number; day_words: any[] }>
): Map<number, number> {
    const map = new Map<number, number>()
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
 *
 * 规则（来自 Excel "90天复习全流程"）：
 * - 当天 + 前一课复习
 * - 从第 4 课开始 "第一轮全面复习"（回溯 lesson-3）
 *
 * @param currentLessonIndex 今天正在学习的有效课程序号（1-based），
 *                           如果今天是空天则传 0，不返回复习内容
 * @returns 需要复习的有效课程序号列表（去重）
 */
export function getLearningPeriodReview(currentLessonIndex: number): number[] {
    if (currentLessonIndex <= 0) return []

    const reviews = new Set<number>()

    // 当天复习
    reviews.add(currentLessonIndex)

    // 前一课复习（lesson >= 2 才有前一课）
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
 *
 * 阶段划分：
 *   抗遗忘 (4天) → 第二轮全面 (N天) → 休息 → 第三轮全面 (N天) → 休息 → 检测1 → 休息 → 检测2 → 休息
 *
 * @param totalLessons 有效课程总数
 * @param totalDays 词汇包日历总天数（含空天）
 * @returns 从 DAY(totalDays+1) 到 DAY(91) 的课表
 */
export function generatePostLearningSchedule(
    totalLessons: number,
    totalDays: number
): DaySchedule[] {
    const schedule: DaySchedule[] = []
    const remainingDays = TOTAL_PLAN_DAYS - totalDays
    if (remainingDays <= 0) return schedule

    let dayOffset = 0
    const addDay = (type: DayType, reviewLessons: number[]) => {
        if (dayOffset >= remainingDays) return
        schedule.push({
            dayNumber: totalDays + 1 + dayOffset,
            type,
            reviewLessons,
        })
        dayOffset++
    }

    const allLessons = Array.from({ length: totalLessons }, (_, i) => i + 1)

    // === Phase 2：抗遗忘 (4天) ===
    // 完成第一轮全面复习（学习期第一轮只覆盖到 lesson N-3）
    // + 间隔强化（分散复习所有课程）
    const antiForgetDays = Math.min(4, remainingDays)
    const firstRoundRemaining: number[] = []
    for (let i = Math.max(1, totalLessons - 2); i <= totalLessons; i++) {
        firstRoundRemaining.push(i)
    }

    // 将所有课程 + 第一轮剩余分成4天
    for (let d = 0; d < antiForgetDays; d++) {
        const lessons = new Set<number>()

        // 分配第一轮剩余
        if (d < firstRoundRemaining.length) {
            lessons.add(firstRoundRemaining[d])
        }

        // 均匀分配间隔复习（模拟7天间隔的效果）
        for (let i = d; i < totalLessons; i += antiForgetDays) {
            lessons.add(i + 1) // 转为 1-based
        }

        addDay('review', Array.from(lessons).sort((a, b) => a - b))
    }

    // === Phase 3：第二轮全面复习 (N天，每天1课) ===
    for (let i = 0; i < totalLessons && dayOffset < remainingDays; i++) {
        addDay('review', [i + 1])
    }

    // === 计算剩余天数并分配休息 + 第三轮 + 检测 ===
    const daysUsed = dayOffset
    const daysLeft = remainingDays - daysUsed

    // 第三轮需要 N 天 + 综合检测需要 2 天
    const thirdRoundNeeded = totalLessons
    const testsNeeded = 2
    const restBudget = daysLeft - thirdRoundNeeded - testsNeeded

    if (restBudget >= 0) {
        // 有足够的天数：休息 → 第三轮 → 休息+检测1 → 休息+检测2
        const restBeforeThird = Math.min(5, Math.floor(restBudget * 0.2))
        const restAfterThird = restBudget - restBeforeThird

        // 休息（第二轮 → 第三轮之间）
        for (let i = 0; i < restBeforeThird; i++) addDay('rest', [])

        // 第三轮全面复习
        for (let i = 0; i < totalLessons && dayOffset < remainingDays; i++) {
            addDay('review', [i + 1])
        }

        // 剩余天数分配：综合检测1 → 休息 → 综合检测2 → 休息
        const afterThirdLeft = remainingDays - dayOffset
        if (afterThirdLeft >= 2) {
            // 综合检测1 放在第三轮后休息一段后
            const restBeforeTest1 = Math.max(0, Math.floor((afterThirdLeft - 2) * 0.3))
            for (let i = 0; i < restBeforeTest1; i++) addDay('rest', [])

            // 综合检测1
            addDay('test', allLessons)

            // 综合检测2 放在接近尾声
            const afterTest1Left = remainingDays - dayOffset
            if (afterTest1Left >= 2) {
                const restBeforeTest2 = afterTest1Left - 1
                for (let i = 0; i < restBeforeTest2; i++) addDay('rest', [])
                // 综合检测2
                addDay('test', allLessons)
            } else {
                // 填充剩余为休息
                while (dayOffset < remainingDays) addDay('rest', [])
            }
        } else {
            // 空间不够放检测，填充休息
            while (dayOffset < remainingDays) addDay('rest', [])
        }
    } else {
        // 空间不够放第三轮，尽可能多做复习
        // 填充剩余天数为复习（按课程循环）
        let lessonIdx = 0
        while (dayOffset < remainingDays - 1) {
            addDay('review', [allLessons[lessonIdx % totalLessons]])
            lessonIdx++
        }
        // 最后一天放综合检测
        if (dayOffset < remainingDays) {
            addDay('test', allLessons)
        }
    }

    return schedule
}

/**
 * 获取某一天应该复习的有效课程序号列表（主入口）
 *
 * @param dayNumber 日历天编号（1-based）
 * @param totalDays 词汇包日历总天数
 * @param totalLessons 有效课程总数
 * @param currentLessonForDay 该天正在学习的有效课程序号（0=空天/非学习日）
 * @returns { type, reviewLessons[] }
 */
export function getDayScheduleInfo(
    dayNumber: number,
    totalDays: number,
    totalLessons: number,
    currentLessonForDay: number = 0
): { type: DayType; reviewLessons: number[] } {
    // 学习期
    if (dayNumber >= 1 && dayNumber <= totalDays) {
        if (currentLessonForDay > 0) {
            return {
                type: 'learn',
                reviewLessons: getLearningPeriodReview(currentLessonForDay),
            }
        }
        // 空天（节假日）
        return { type: 'rest', reviewLessons: [] }
    }

    // 学习结束后：从缓存或生成的课表中查找
    const postSchedule = generatePostLearningSchedule(totalLessons, totalDays)
    const entry = postSchedule.find(s => s.dayNumber === dayNumber)
    if (entry) {
        return { type: entry.type, reviewLessons: entry.reviewLessons }
    }

    // 超出91天
    return { type: 'rest', reviewLessons: [] }
}

/**
 * 将有效课程序号列表转为实际的 dayNumber 列表
 * @param lessonIndices 有效课程序号（1-based）
 * @param lessonMap 由 getEffectiveLessons() 返回的映射
 * @returns 实际的 pack_days dayNumber 列表
 */
export function resolveToPackDayNumbers(
    lessonIndices: number[],
    lessonMap: Map<number, number>
): number[] {
    const result: number[] = []
    for (const idx of lessonIndices) {
        const dn = lessonMap.get(idx)
        if (dn !== undefined) result.push(dn)
    }
    return result
}

/**
 * 获取整个91天每天的课表摘要（用于 study-days API）
 * @param totalDays 词汇包日历总天数
 * @param totalLessons 有效课程总数
 * @param lessonMap 有效课程映射
 * @returns 数组，索引0=DAY1，每项包含 type 和 reviewDayNumbers
 */
export function getFullScheduleSummary(
    totalDays: number,
    totalLessons: number,
    lessonMap: Map<number, number>
): Array<{ type: DayType; reviewDayNumbers: number[] }> {
    const postSchedule = generatePostLearningSchedule(totalLessons, totalDays)
    const postMap = new Map<number, DaySchedule>()
    for (const s of postSchedule) postMap.set(s.dayNumber, s)

    // 反向映射：dayNumber → lessonIndex
    const dayToLesson = new Map<number, number>()
    for (const [li, dn] of lessonMap.entries()) dayToLesson.set(dn, li)

    const summary: Array<{ type: DayType; reviewDayNumbers: number[] }> = []

    for (let day = 1; day <= TOTAL_PLAN_DAYS; day++) {
        if (day <= totalDays) {
            // 学习期
            const lessonIdx = dayToLesson.get(day) || 0
            if (lessonIdx > 0) {
                const reviewLessons = getLearningPeriodReview(lessonIdx)
                summary.push({
                    type: 'learn',
                    reviewDayNumbers: resolveToPackDayNumbers(reviewLessons, lessonMap),
                })
            } else {
                // 空天
                summary.push({ type: 'rest', reviewDayNumbers: [] })
            }
        } else {
            // 学习结束后
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
