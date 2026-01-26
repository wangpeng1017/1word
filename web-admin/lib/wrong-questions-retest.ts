/**
 * @file wrong-questions-retest.ts
 * @desc 错题重测服务 - 获取错题、提交答案、检查成就
 */

import { prisma } from '@/lib/prisma'

interface RetestQuestion {
  wrongQuestionId: string
  questionId: string
  vocabularyId: string
  content: string
  type: string
  correctAnswer: string
  wrongCount: number
}

interface RetestQuestionsResult {
  questions: RetestQuestion[]
  totalCount: number
}

interface RetestAnswer {
  wrongQuestionId: string
  questionId: string
  answer: string
  isCorrect: boolean
}

interface SubmitResult {
  correctCount: number
  wrongCount: number
  accuracy: number
  isPerfect: boolean
  removedFromWrongBook: string[]
}

interface AchievementCheckResult {
  unlockedAchievements: any[]
}

/**
 * 获取用户所有 ACTIVE 状态的错题用于重测
 */
export async function getRetestQuestions(studentId: string): Promise<RetestQuestionsResult> {
  // 获取所有 ACTIVE 状态的错题
  const wrongQuestions = await prisma.wrong_questions.findMany({
    where: {
      studentId,
      status: 'ACTIVE',
    },
    orderBy: { wrongCount: 'desc' }, // 错误次数多的优先
  })

  if (wrongQuestions.length === 0) {
    return { questions: [], totalCount: 0 }
  }

  // 获取对应的题目详情
  const questionIds = wrongQuestions.map(wq => wq.questionId)
  const questions = await prisma.questions.findMany({
    where: { id: { in: questionIds } },
  })

  const questionMap = new Map(questions.map(q => [q.id, q]))

  // 组装返回数据
  const retestQuestions: RetestQuestion[] = wrongQuestions.map(wq => {
    const question = questionMap.get(wq.questionId)
    return {
      wrongQuestionId: wq.id,
      questionId: wq.questionId,
      vocabularyId: wq.vocabularyId,
      content: question?.content || '',
      type: question?.type || 'CHOICE',
      correctAnswer: wq.correctAnswer,
      wrongCount: wq.wrongCount || 1,
    }
  })

  return {
    questions: retestQuestions,
    totalCount: retestQuestions.length,
  }
}

/**
 * 提交重测答案
 */
export async function submitRetestAnswers(
  studentId: string,
  answers: RetestAnswer[]
): Promise<SubmitResult> {
  const correctAnswers = answers.filter(a => a.isCorrect)
  const wrongAnswers = answers.filter(a => !a.isCorrect)

  const removedFromWrongBook: string[] = []

  await prisma.$transaction(async (tx) => {
    // 处理答对的题目 - 从错题本移除（状态改为 MASTERED）
    for (const answer of correctAnswers) {
      await tx.wrong_questions.update({
        where: { id: answer.wrongQuestionId },
        data: {
          status: 'MASTERED',
          correctCount: { increment: 1 },
          lastReviewAt: new Date(),
        },
      })
      removedFromWrongBook.push(answer.wrongQuestionId)
    }

    // 处理答错的题目 - 增加 wrongCount
    for (const answer of wrongAnswers) {
      await tx.wrong_questions.update({
        where: { id: answer.wrongQuestionId },
        data: {
          wrongCount: { increment: 1 },
          wrongAnswer: answer.answer,
          wrongAt: new Date(),
        },
      })
    }
  })

  const totalCount = answers.length
  const correctCount = correctAnswers.length
  const wrongCount = wrongAnswers.length
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0

  return {
    correctCount,
    wrongCount,
    accuracy,
    isPerfect: wrongCount === 0 && correctCount > 0,
    removedFromWrongBook,
  }
}

/**
 * 检查并解锁错题相关成就
 */
export async function checkWrongQuestionAchievements(
  studentId: string,
  totalCorrectWrongQuestions: number
): Promise<AchievementCheckResult> {
  // 获取所有错题相关成就
  const achievements = await prisma.achievements.findMany({
    where: {
      type: 'wrong_question',
      isActive: true,
    },
  })

  const unlockedAchievements: any[] = []

  for (const achievement of achievements) {
    const condition = achievement.condition as any

    // 检查是否满足条件
    if (
      condition?.type === 'wrong_question_correct' &&
      totalCorrectWrongQuestions >= condition.count
    ) {
      // 检查是否已解锁
      const existing = await prisma.student_achievements.findUnique({
        where: {
          studentId_achievementId: { studentId, achievementId: achievement.id },
        },
      })

      if (!existing) {
        // 解锁成就
        await prisma.student_achievements.create({
          data: {
            id: `sa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            studentId,
            achievementId: achievement.id,
          },
        })

        unlockedAchievements.push(achievement)

        // 发放积分奖励
        if (achievement.points > 0) {
          await prisma.student_points.upsert({
            where: { studentId },
            create: {
              id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              studentId,
              totalPoints: achievement.points,
              dailyPoints: achievement.points,
              weeklyPoints: achievement.points,
              monthlyPoints: achievement.points,
              level: 1,
            },
            update: {
              totalPoints: { increment: achievement.points },
            },
          })

          await prisma.point_history.create({
            data: {
              id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              studentId,
              points: achievement.points,
              reason: `解锁成就【${achievement.name}】`,
              relatedType: 'achievement',
              relatedId: achievement.id,
            },
          })
        }
      }
    }
  }

  return { unlockedAchievements }
}

/**
 * 获取用户累计答对的错题数量
 */
export async function getTotalCorrectWrongQuestions(studentId: string): Promise<number> {
  const result = await prisma.wrong_questions.aggregate({
    where: {
      studentId,
      status: 'MASTERED',
    },
    _count: true,
  })

  return result._count || 0
}
