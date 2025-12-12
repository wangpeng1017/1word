/**
 * 数据归档工具
 * 用于清理旧数据，保持数据库性能
 */

import { prisma } from '@/lib/prisma'

/**
 * 归档配置
 */
export const ARCHIVE_CONFIG = {
  // question_answers 保留天数（默认90天）
  QUESTION_ANSWERS_RETENTION_DAYS: 90,
  // wrong_questions 保留天数（默认180天，错题需要更长时间分析）
  WRONG_QUESTIONS_RETENTION_DAYS: 180,
  // point_history 保留天数（默认365天）
  POINT_HISTORY_RETENTION_DAYS: 365,
  // 每次归档的最大记录数（防止长时间锁表）
  BATCH_SIZE: 5000,
}

/**
 * 归档 question_answers 表
 * 保留最近 N 天的数据，删除更早的数据
 *
 * 注意：由于掌握判定只需要最近3条记录，90天足够
 */
export async function archiveQuestionAnswers(retentionDays?: number) {
  const days = retentionDays || ARCHIVE_CONFIG.QUESTION_ANSWERS_RETENTION_DAYS
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  cutoffDate.setHours(0, 0, 0, 0)

  try {
    // 先统计要删除的记录数
    const countToDelete = await prisma.question_answers.count({
      where: {
        answeredAt: {
          lt: cutoffDate
        }
      }
    })

    if (countToDelete === 0) {
      console.log('[ARCHIVE] question_answers: 无需归档')
      return { deleted: 0, cutoffDate }
    }

    // 分批删除，避免长时间锁表
    let totalDeleted = 0
    let batchDeleted = 0

    do {
      // 获取要删除的记录 ID
      const recordsToDelete = await prisma.question_answers.findMany({
        where: {
          answeredAt: {
            lt: cutoffDate
          }
        },
        select: { id: true },
        take: ARCHIVE_CONFIG.BATCH_SIZE
      })

      if (recordsToDelete.length === 0) break

      const idsToDelete = recordsToDelete.map(r => r.id)

      const result = await prisma.question_answers.deleteMany({
        where: {
          id: { in: idsToDelete }
        }
      })

      batchDeleted = result.count
      totalDeleted += batchDeleted

      console.log(`[ARCHIVE] question_answers: 批量删除 ${batchDeleted} 条，累计 ${totalDeleted}/${countToDelete}`)
    } while (batchDeleted === ARCHIVE_CONFIG.BATCH_SIZE)

    console.log(`[ARCHIVE] question_answers: 归档完成，共删除 ${totalDeleted} 条记录（截止日期: ${cutoffDate.toISOString()}）`)
    return { deleted: totalDeleted, cutoffDate }
  } catch (error) {
    console.error('[ARCHIVE] question_answers 归档失败:', error)
    throw error
  }
}

/**
 * 归档 wrong_questions 表
 */
export async function archiveWrongQuestions(retentionDays?: number) {
  const days = retentionDays || ARCHIVE_CONFIG.WRONG_QUESTIONS_RETENTION_DAYS
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  cutoffDate.setHours(0, 0, 0, 0)

  try {
    const result = await prisma.wrong_questions.deleteMany({
      where: {
        wrongAt: {
          lt: cutoffDate
        }
      }
    })

    console.log(`[ARCHIVE] wrong_questions: 归档完成，删除 ${result.count} 条记录`)
    return { deleted: result.count, cutoffDate }
  } catch (error) {
    console.error('[ARCHIVE] wrong_questions 归档失败:', error)
    throw error
  }
}

/**
 * 归档 point_history 表
 */
export async function archivePointHistory(retentionDays?: number) {
  const days = retentionDays || ARCHIVE_CONFIG.POINT_HISTORY_RETENTION_DAYS
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  cutoffDate.setHours(0, 0, 0, 0)

  try {
    const result = await prisma.point_history.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    console.log(`[ARCHIVE] point_history: 归档完成，删除 ${result.count} 条记录`)
    return { deleted: result.count, cutoffDate }
  } catch (error) {
    console.error('[ARCHIVE] point_history 归档失败:', error)
    throw error
  }
}

/**
 * 执行全部归档任务
 */
export async function runAllArchiveTasks() {
  const results = {
    questionAnswers: { deleted: 0, cutoffDate: new Date() },
    wrongQuestions: { deleted: 0, cutoffDate: new Date() },
    pointHistory: { deleted: 0, cutoffDate: new Date() },
  }

  try {
    results.questionAnswers = await archiveQuestionAnswers()
    results.wrongQuestions = await archiveWrongQuestions()
    results.pointHistory = await archivePointHistory()

    console.log('[ARCHIVE] 全部归档任务完成:', results)
    return results
  } catch (error) {
    console.error('[ARCHIVE] 归档任务失败:', error)
    throw error
  }
}

/**
 * 获取数据统计信息（用于监控数据增长）
 */
export async function getDataStats() {
  const [
    questionAnswersCount,
    wrongQuestionsCount,
    pointHistoryCount,
    studyRecordsCount,
    dailyTasksCount,
  ] = await Promise.all([
    prisma.question_answers.count(),
    prisma.wrong_questions.count(),
    prisma.point_history.count(),
    prisma.study_records.count(),
    prisma.daily_tasks.count(),
  ])

  return {
    questionAnswers: questionAnswersCount,
    wrongQuestions: wrongQuestionsCount,
    pointHistory: pointHistoryCount,
    studyRecords: studyRecordsCount,
    dailyTasks: dailyTasksCount,
    timestamp: new Date().toISOString(),
  }
}
