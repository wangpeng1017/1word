/**
 * @file 积分验证器测试
 * @desc 测试服务端答案验证和防重复积分功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateAnswer,
  validateAnswers,
  isDuplicatePointsAward,
  calculatePoints
} from '@/lib/points-validator'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    questions: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    point_history: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('validateAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when user answer matches correctAnswer', async () => {
    const mockQuestion = {
      id: 'q1',
      correctAnswer: 'apple',
      type: 'ENGLISH_TO_CHINESE',
    }
    vi.mocked(prisma.questions.findUnique).mockResolvedValue(mockQuestion as any)

    const result = await validateAnswer('q1', 'apple')
    expect(result).toBe(true)
  })

  it('should return false when user answer does not match correctAnswer', async () => {
    const mockQuestion = {
      id: 'q1',
      correctAnswer: 'apple',
      type: 'ENGLISH_TO_CHINESE',
    }
    vi.mocked(prisma.questions.findUnique).mockResolvedValue(mockQuestion as any)

    const result = await validateAnswer('q1', 'banana')
    expect(result).toBe(false)
  })

  it('should return false when question not found', async () => {
    vi.mocked(prisma.questions.findUnique).mockResolvedValue(null)

    const result = await validateAnswer('non-existent', 'answer')
    expect(result).toBe(false)
  })

  it('should be case-insensitive for English answers', async () => {
    const mockQuestion = {
      id: 'q1',
      correctAnswer: 'Apple',
      type: 'CHINESE_TO_ENGLISH',
    }
    vi.mocked(prisma.questions.findUnique).mockResolvedValue(mockQuestion as any)

    const result = await validateAnswer('q1', 'apple')
    expect(result).toBe(true)
  })

  it('should trim whitespace from answers', async () => {
    const mockQuestion = {
      id: 'q1',
      correctAnswer: 'apple',
      type: 'ENGLISH_TO_CHINESE',
    }
    vi.mocked(prisma.questions.findUnique).mockResolvedValue(mockQuestion as any)

    const result = await validateAnswer('q1', '  apple  ')
    expect(result).toBe(true)
  })
})

describe('validateAnswers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate multiple answers and return correct results', async () => {
    const mockQuestions = [
      { id: 'q1', correctAnswer: 'apple', type: 'ENGLISH_TO_CHINESE' },
      { id: 'q2', correctAnswer: 'banana', type: 'ENGLISH_TO_CHINESE' },
      { id: 'q3', correctAnswer: 'cherry', type: 'ENGLISH_TO_CHINESE' },
    ]
    vi.mocked(prisma.questions.findMany).mockResolvedValue(mockQuestions as any)

    const answers = [
      { questionId: 'q1', answer: 'apple', isCorrect: true },   // client says true, actually true
      { questionId: 'q2', answer: 'wrong', isCorrect: true },   // client says true, actually false!
      { questionId: 'q3', answer: 'cherry', isCorrect: false }, // client says false, actually true!
    ]

    const results = await validateAnswers(answers)

    expect(results).toEqual([
      { questionId: 'q1', answer: 'apple', isCorrect: true, serverValidated: true },
      { questionId: 'q2', answer: 'wrong', isCorrect: false, serverValidated: true },   // corrected!
      { questionId: 'q3', answer: 'cherry', isCorrect: true, serverValidated: true },   // corrected!
    ])
  })

  it('should detect cheating attempts (client claiming correct but actually wrong)', async () => {
    const mockQuestions = [
      { id: 'q1', correctAnswer: 'apple', type: 'ENGLISH_TO_CHINESE' },
    ]
    vi.mocked(prisma.questions.findMany).mockResolvedValue(mockQuestions as any)

    const answers = [
      { questionId: 'q1', answer: 'banana', isCorrect: true }, // CHEATING: claiming correct
    ]

    const results = await validateAnswers(answers)

    // Server should override the client's lie
    expect(results[0].isCorrect).toBe(false)
    expect(results[0].serverValidated).toBe(true)
  })
})

describe('isDuplicatePointsAward', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true if points already awarded for this studyRecordId', async () => {
    vi.mocked(prisma.point_history.findFirst).mockResolvedValue({
      id: 'ph1',
      studentId: 'student1',
      relatedId: 'sr123',
      relatedType: 'study_record',
      points: 10,
      reason: 'test',
      createdAt: new Date(),
    } as any)

    const result = await isDuplicatePointsAward('student1', 'study_record', 'sr123')
    expect(result).toBe(true)
  })

  it('should return false if no previous points award found', async () => {
    vi.mocked(prisma.point_history.findFirst).mockResolvedValue(null)

    const result = await isDuplicatePointsAward('student1', 'study_record', 'sr123')
    expect(result).toBe(false)
  })
})

describe('calculatePoints', () => {
  it('should calculate correct base points for correct answers', () => {
    const result = calculatePoints({
      correctCount: 5,
      totalWords: 10,
      accuracy: 0.5,
    })

    expect(result.basePoints).toBe(5) // 1 point per correct answer
    expect(result.completionBonus).toBe(5) // completion bonus
    expect(result.perfectBonus).toBe(0) // not perfect
    expect(result.totalPoints).toBe(10) // 5 + 5 + 0
  })

  it('should award perfect bonus when accuracy is 100%', () => {
    const result = calculatePoints({
      correctCount: 10,
      totalWords: 10,
      accuracy: 1.0,
    })

    expect(result.basePoints).toBe(10)
    expect(result.completionBonus).toBe(5)
    expect(result.perfectBonus).toBe(3)
    expect(result.totalPoints).toBe(18) // 10 + 5 + 3
  })

  it('should not award negative points', () => {
    const result = calculatePoints({
      correctCount: 0,
      totalWords: 10,
      accuracy: 0,
    })

    expect(result.basePoints).toBe(0)
    expect(result.completionBonus).toBe(5) // still get completion bonus
    expect(result.totalPoints).toBe(5)
  })
})
