import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hashPassword, verifyPassword, generateToken, verifyToken, getTokenFromHeader } from '../../../lib/auth'

describe('auth', () => {
  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'test123'
      const hash = await hashPassword(password)
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'test123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'test123'
      const hash = await hashPassword(password)
      const result = await verifyPassword(password, hash)
      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const hash = await hashPassword('test123')
      const result = await verifyPassword('wrong', hash)
      expect(result).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate JWT token', () => {
      const payload = { userId: '123', role: 'admin' }
      const token = generateToken(payload)
      expect(token).toBeTruthy()
      expect(token.split('.')).toHaveLength(3)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const payload = { userId: '123', role: 'admin' }
      const token = generateToken(payload)
      const result = verifyToken(token)
      expect(result?.userId).toBe('123')
      expect(result?.role).toBe('admin')
    })

    it('should return null for invalid token', () => {
      const result = verifyToken('invalid.token.here')
      expect(result).toBe(null)
    })

    it('should cache verified tokens', () => {
      const payload = { userId: '123', role: 'admin' }
      const token = generateToken(payload)
      verifyToken(token)
      const result = verifyToken(token)
      expect(result?.userId).toBe('123')
    })
  })

  describe('getTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = getTokenFromHeader('Bearer abc123')
      expect(token).toBe('abc123')
    })

    it('should return null for missing header', () => {
      expect(getTokenFromHeader(null)).toBe(null)
      expect(getTokenFromHeader(undefined)).toBe(null)
    })

    it('should return null for non-Bearer header', () => {
      expect(getTokenFromHeader('Basic abc123')).toBe(null)
    })
  })
})
