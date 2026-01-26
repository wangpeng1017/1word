/**
 * @file wrong-questions-retest.test.ts
 * @desc 错题重测服务测试 - TDD RED 阶段
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    wrong_questions: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    questions: {
      findMany: vi.fn(),
    },
    student_achievements: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    achievements: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({
      wrong_questions: { findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
      questions: { findMany: vi.fn() },
    })),
  },
}))

import { prisma } from '@/lib/prisma'

// 这些函数将在 lib/wrong-questions-retest.ts 中实现
import {
  getRetestQuestions,
  submitRetestAnswers,
  checkWrongQuestionAchievements,
} from '@/lib/wrong-questions-retest'

describe('Wrong Questions Retest Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRetestQuestions', () => {
    it('应该返回所有 ACTIVE 状态的错题用于重测', async () => {
      const studentId = 'stu_test_001'

      const mockWrongQuestions = [
        {
          id: 'wq_1',
          studentId,
          questionId: 'q_1',
          vocabularyId: 'v_1',
          wrongAnswer: 'wrong',
          correctAnswer: 'correct',
          status: 'ACTIVE',
          wrongCount: 2,
        },
        {
          id: 'wq_2',
          studentId,
          questionId: 'q_2',
          vocabularyId: 'v_2',
          wrongAnswer: 'bad',
          correctAnswer: 'good',
          status: 'ACTIVE',
          wrongCount: 1,
        },
      ]

      const mockQuestions = [
        { id: 'q_1', content: '选择正确的翻译', correctAnswer: 'correct', type: 'CHOICE' },
        { id: 'q_2', content: '选择正确的翻译', correctAnswer: 'good', type: 'CHOICE' },
      ]

      vi.mocked(prisma.wrong_questions.findMany).mockResolvedValue(mockWrongQuestions as any)
      vi.mocked(prisma.questions.findMany).mockResolvedValue(mockQuestions as any)

      const result = await getRetestQuestions(studentId)

      expect(result.questions).toHaveLength(2)
      expect(result.totalCount).toBe(2)
      expect(result.questions[0]).toHaveProperty('questionId')
      expect(result.questions[0]).toHaveProperty('content')
    })

    it('没有错题时应该返回空数组', async () => {
      const studentId = 'stu_test_002'

      vi.mocked(prisma.wrong_questions.findMany).mockResolvedValue([])

      const result = await getRetestQuestions(studentId)

      expect(result.questions).toHaveLength(0)
      expect(result.totalCount).toBe(0)
    })
  })

  describe('submitRetestAnswers', () => {
    it('答对的题目应该从错题本移除（状态改为 MASTERED）', async () => {
      const studentId = 'stu_test_001'
      const answers = [
        { wrongQuestionId: 'wq_1', questionId: 'q_1', answer: 'correct', isCorrect: true },
        { wrongQuestionId: 'wq_2', questionId: 'q_2', answer: 'wrong', isCorrect: false },
      ]

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          wrong_questions: {
            update: vi.fn().mockResolvedValue({}),
          },
        }
        return fn(tx)
      })

      const result = await submitRetestAnswers(studentId, answers)

      expect(result.correctCount).toBe(1)
      expect(result.wrongCount).toBe(1)
      expect(result.removedFromWrongBook).toHaveLength(1)
      expect(result.removedFromWrongBook[0]).toBe('wq_1')
    })

    it('答错的题目应该增加 wrongCount', async () => {
      const studentId = 'stu_test_001'
      const answers = [
        { wrongQuestionId: 'wq_1', questionId: 'q_1', answer: 'still_wrong', isCorrect: false },
      ]

      const mockUpdate = vi.fn()
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          wrong_questions: {
            update: mockUpdate,
          },
        }
        return fn(tx)
      })

      await submitRetestAnswers(studentId, answers)

      // 验证 wrongCount 增加
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wq_1' },
          data: expect.objectContaining({
            wrongCount: expect.any(Object), // { increment: 1 }
          }),
        })
      )
    })

    it('全部答对时应该返回完美成绩', async () => {
      const studentId = 'stu_test_001'
      const answers = [
        { wrongQuestionId: 'wq_1', questionId: 'q_1', answer: 'correct', isCorrect: true },
        { wrongQuestionId: 'wq_2', questionId: 'q_2', answer: 'good', isCorrect: true },
      ]

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          wrong_questions: { update: vi.fn() },
        }
        return fn(tx)
      })

      const result = await submitRetestAnswers(studentId, answers)

      expect(result.correctCount).toBe(2)
      expect(result.wrongCount).toBe(0)
      expect(result.accuracy).toBe(1)
      expect(result.isPerfect).toBe(true)
    })
  })

  describe('checkWrongQuestionAchievements', () => {
    it('答对10道错题应该解锁初级错题克星成就', async () => {
      const studentId = 'stu_test_001'
      const totalCorrectWrongQuestions = 10

      const mockAchievements = [
        {
          id: 'ach_wrong_10',
          name: '错题克星·初级',
          type: 'wrong_question',
          condition: { type: 'wrong_question_correct', count: 10 },
        },
      ]

      vi.mocked(prisma.achievements.findMany).mockResolvedValue(mockAchievements as any)
      vi.mocked(prisma.student_achievements.findUnique).mockResolvedValue(null) // 未解锁
      vi.mocked(prisma.student_achievements.create).mockResolvedValue({ id: 'sa_new' } as any)

      const result = await checkWrongQuestionAchievements(studentId, totalCorrectWrongQuestions)

      expect(result.unlockedAchievements).toHaveLength(1)
      expect(result.unlockedAchievements[0].name).toBe('错题克星·初级')
    })

    it('答对50道错题应该解锁中级错题克星成就', async () => {
      const studentId = 'stu_test_001'
      const totalCorrectWrongQuestions = 50

      const mockAchievements = [
        {
          id: 'ach_wrong_10',
          name: '错题克星·初级',
          type: 'wrong_question',
          condition: { type: 'wrong_question_correct', count: 10 },
        },
        {
          id: 'ach_wrong_50',
          name: '错题克星·中级',
          type: 'wrong_question',
          condition: { type: 'wrong_question_correct', count: 50 },
        },
      ]

      vi.mocked(prisma.achievements.findMany).mockResolvedValue(mockAchievements as any)
      // 初级已解锁，中级未解锁
      vi.mocked(prisma.student_achievements.findUnique)
        .mockResolvedValueOnce({ id: 'sa_1' } as any) // 初级已解锁
        .mockResolvedValueOnce(null) // 中级未解锁
      vi.mocked(prisma.student_achievements.create).mockResolvedValue({ id: 'sa_new' } as any)

      const result = await checkWrongQuestionAchievements(studentId, totalCorrectWrongQuestions)

      expect(result.unlockedAchievements).toHaveLength(1)
      expect(result.unlockedAchievements[0].name).toBe('错题克星·中级')
    })

    it('已解锁的成就不应该重复解锁', async () => {
      const studentId = 'stu_test_001'
      const totalCorrectWrongQuestions = 15

      const mockAchievements = [
        {
          id: 'ach_wrong_10',
          name: '错题克星·初级',
          type: 'wrong_question',
          condition: { type: 'wrong_question_correct', count: 10 },
        },
      ]

      vi.mocked(prisma.achievements.findMany).mockResolvedValue(mockAchievements as any)
      vi.mocked(prisma.student_achievements.findUnique).mockResolvedValue({ id: 'sa_existing' } as any) // 已解锁

      const result = await checkWrongQuestionAchievements(studentId, totalCorrectWrongQuestions)

      expect(result.unlockedAchievements).toHaveLength(0)
      expect(prisma.student_achievements.create).not.toHaveBeenCalled()
    })
  })
})
