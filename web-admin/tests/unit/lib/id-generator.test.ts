import { describe, it, expect } from 'vitest'
import { generateId, generateIds, extractPrefix, isValidId } from '../../../lib/id-generator'

describe('id-generator', () => {
  describe('generateId', () => {
    it('should generate ID with correct prefix', () => {
      const id = generateId('sp')
      expect(id.startsWith('sp_')).toBe(true)
    })

    it('should generate unique IDs', () => {
      const id1 = generateId('sp')
      const id2 = generateId('sp')
      expect(id1).not.toBe(id2)
    })

    it('should generate valid UUID format', () => {
      const id = generateId('dt')
      expect(isValidId(id)).toBe(true)
    })
  })

  describe('generateIds', () => {
    it('should generate correct number of IDs', () => {
      const ids = generateIds('pc', 5)
      expect(ids).toHaveLength(5)
    })

    it('should generate all unique IDs', () => {
      const ids = generateIds('wm', 10)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10)
    })

    it('should generate IDs with correct prefix', () => {
      const ids = generateIds('sr', 3)
      ids.forEach(id => {
        expect(id.startsWith('sr_')).toBe(true)
      })
    })
  })

  describe('extractPrefix', () => {
    it('should extract prefix from valid ID', () => {
      const id = generateId('qa')
      expect(extractPrefix(id)).toBe('qa')
    })

    it('should return null for invalid format', () => {
      expect(extractPrefix('invalid')).toBe(null)
      expect(extractPrefix('123_abc')).toBe(null)
    })
  })

  describe('isValidId', () => {
    it('should return true for valid ID', () => {
      const id = generateId('sp')
      expect(isValidId(id)).toBe(true)
    })

    it('should return false for invalid format', () => {
      expect(isValidId('invalid')).toBe(false)
      expect(isValidId('sp_not-a-uuid')).toBe(false)
    })

    it('should validate expected prefix', () => {
      const id = generateId('sp')
      expect(isValidId(id, 'sp')).toBe(true)
      expect(isValidId(id, 'dt')).toBe(false)
    })
  })
})
