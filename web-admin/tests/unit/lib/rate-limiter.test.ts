/**
 * @file 速率限制器测试
 * @desc 测试登录速率限制功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  RateLimiter,
  checkLoginRateLimit,
  RateLimitResult,
  resetLoginRateLimiter,
} from '@/lib/rate-limiter'

// Mock Redis
vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn(),
}))

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxAttempts: 5,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('check', () => {
    it('should allow requests under the limit', () => {
      const result = rateLimiter.check('test-key')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(4) // 5 - 1
    })

    it('should track multiple attempts', () => {
      rateLimiter.check('test-key') // 1
      rateLimiter.check('test-key') // 2
      rateLimiter.check('test-key') // 3
      const result = rateLimiter.check('test-key') // 4
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(1)
    })

    it('should block after max attempts reached', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.check('test-key')
      }
      const result = rateLimiter.check('test-key') // 6th attempt
      expect(result.allowed).toBe(false)
      expect(result.remainingAttempts).toBe(0)
      expect(result.retryAfterMs).toBeGreaterThan(0)
    })

    it('should track different keys independently', () => {
      // Max out key1
      for (let i = 0; i < 5; i++) {
        rateLimiter.check('key1')
      }

      // key2 should still be allowed
      const result = rateLimiter.check('key2')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(4)
    })

    it('should reset after window expires', () => {
      // Use all attempts
      for (let i = 0; i < 5; i++) {
        rateLimiter.check('test-key')
      }

      // Should be blocked
      expect(rateLimiter.check('test-key').allowed).toBe(false)

      // Fast forward past the window
      vi.advanceTimersByTime(60001)

      // Should be allowed again
      const result = rateLimiter.check('test-key')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(4)
    })

    it('should use sliding window (old attempts expire)', () => {
      // Make 3 attempts
      rateLimiter.check('test-key')
      rateLimiter.check('test-key')
      rateLimiter.check('test-key')

      // Wait 30 seconds
      vi.advanceTimersByTime(30000)

      // Make 2 more attempts (still within window for first 3)
      rateLimiter.check('test-key')
      rateLimiter.check('test-key')

      // Should be at limit now (5 attempts in last minute)
      expect(rateLimiter.check('test-key').allowed).toBe(false)

      // Wait 31 more seconds (first 3 attempts should expire)
      vi.advanceTimersByTime(31000)

      // Should have 3 attempts available again
      const result = rateLimiter.check('test-key')
      expect(result.allowed).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset attempts for a key', () => {
      // Use all attempts
      for (let i = 0; i < 5; i++) {
        rateLimiter.check('test-key')
      }
      expect(rateLimiter.check('test-key').allowed).toBe(false)

      // Reset
      rateLimiter.reset('test-key')

      // Should be allowed again
      const result = rateLimiter.check('test-key')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(4)
    })
  })
})

describe('checkLoginRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetLoginRateLimiter() // 重置全局限制器
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should limit by IP', async () => {
    // Make 5 attempts from same IP
    for (let i = 0; i < 5; i++) {
      await checkLoginRateLimit('192.168.1.1', 'user1@test.com')
    }

    // 6th attempt should be blocked
    const result = await checkLoginRateLimit('192.168.1.1', 'user2@test.com')
    expect(result.allowed).toBe(false)
  })

  it('should limit by username', async () => {
    // Make 5 attempts for same username from different IPs
    for (let i = 0; i < 5; i++) {
      await checkLoginRateLimit(`192.168.1.${i}`, 'admin@test.com')
    }

    // 6th attempt should be blocked even from new IP
    const result = await checkLoginRateLimit('192.168.1.100', 'admin@test.com')
    expect(result.allowed).toBe(false)
  })

  it('should allow different users from same IP (within limit)', async () => {
    // Make 3 attempts from same IP
    await checkLoginRateLimit('192.168.1.1', 'user1@test.com')
    await checkLoginRateLimit('192.168.1.1', 'user2@test.com')

    // Should still be allowed
    const result = await checkLoginRateLimit('192.168.1.1', 'user3@test.com')
    expect(result.allowed).toBe(true)
  })

  it('should return retry time when blocked', async () => {
    // Max out attempts
    for (let i = 0; i < 5; i++) {
      await checkLoginRateLimit('192.168.1.1', 'test@test.com')
    }

    const result = await checkLoginRateLimit('192.168.1.1', 'test@test.com')
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeDefined()
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })
})
