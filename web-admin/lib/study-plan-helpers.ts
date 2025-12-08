import { prisma } from './prisma'
import { calculateNextReviewDate, getTodayDate } from './ebbinghaus'

/**
 * 重置学习计划进度
 * 同步重置 study_plans 和 word_masteries 两张表，确保数据一致性
 *
 * @param planIds 要重置的学习计划ID数组
 * @returns 重置后的学习计划列表
 */
export async function resetStudyPlans(planIds: string[]) {
  if (!planIds || planIds.length === 0) {
    return []
  }

  // 获取要重置的学习计划
  const plans = await prisma.study_plans.findMany({
    where: {
      id: { in: planIds }
    },
    include: {
      vocabularies: {
        select: {
          word: true,
          primary_meaning: true,
          difficulty: true,
        }
      },
      students: {
        include: {
          user: {
            select: { name: true }
          }
        }
      }
    }
  })

  if (plans.length === 0) {
    return []
  }

  const today = getTodayDate()
  const resetResults = []

  // 重置每个学习计划
  for (const plan of plans) {
    // 计算新的首次复习时间（使用艾宾浩斯算法）
    const nextReviewAt = calculateNextReviewDate(
      today,
      0, // 复习次数重置为0
      1, // 初始正确率100%
      plan.vocabularies.difficulty as 'EASY' | 'MEDIUM' | 'HARD'
    )

    // 1. 重置 study_plans 表
    const updatedPlan = await prisma.study_plans.update({
      where: { id: plan.id },
      data: {
        status: 'PENDING',
        reviewCount: 0,
        lastReviewAt: null,
        nextReviewAt,
        updatedAt: new Date(),
      }
    })

    // 2. 同步重置 word_masteries 表
    await prisma.word_masteries.updateMany({
      where: {
        studentId: plan.studentId,
        vocabularyId: plan.vocabularyId,
      },
      data: {
        totalWrongCount: 0,
        recentAccuracy: null,
        consecutiveCorrect: 0,
        isMastered: false,
        isDifficult: false,
        lastPracticeAt: null,
        updatedAt: new Date(),
      }
    })

    resetResults.push({
      planId: updatedPlan.id,
      studentId: plan.studentId,
      studentName: plan.students.user.name,
      vocabularyId: plan.vocabularyId,
      word: plan.vocabularies.word,
      primaryMeaning: plan.vocabularies.primary_meaning,
      status: updatedPlan.status,
      reviewCount: updatedPlan.reviewCount,
      nextReviewAt: updatedPlan.nextReviewAt,
    })
  }

  return resetResults
}

/**
 * 批量重置学习计划（通过学生ID和词汇ID）
 * 用于批量生成计划时的重置场景
 *
 * @param studentVocabPairs 学生ID和词汇ID的配对数组
 * @returns 重置的计划ID数组
 */
export async function resetStudyPlansByPairs(
  studentVocabPairs: Array<{ studentId: string; vocabularyId: string }>
) {
  if (!studentVocabPairs || studentVocabPairs.length === 0) {
    return []
  }

  // 查找对应的学习计划
  const plans = await prisma.study_plans.findMany({
    where: {
      OR: studentVocabPairs.map(({ studentId, vocabularyId }) => ({
        studentId,
        vocabularyId,
      }))
    },
    select: { id: true }
  })

  const planIds = plans.map(p => p.id)

  if (planIds.length === 0) {
    return []
  }

  // 调用统一的重置函数
  return await resetStudyPlans(planIds)
}
