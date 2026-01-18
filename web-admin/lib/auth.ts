import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cacheGet, cacheSet } from './redis'

// JWT 密钥必须通过环境变量设置
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('生产环境必须设置 JWT_SECRET 环境变量')
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-only-secret-key-do-not-use-in-production'

// 内存缓存（Redis不可用时的降级方案）
const tokenCache = new Map<string, { payload: JWTPayload; expireAt: number }>()
const MEMORY_CACHE_TTL = 5 * 60 * 1000 // 5分钟

export interface JWTPayload {
  userId: string
  email?: string
  role: string
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// 密码验证
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// 生成JWT Token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn: '7d' })
}

// 验证JWT Token（带内存缓存）
export function verifyToken(token: string): JWTPayload | null {
  const cacheKey = token.slice(-16)
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expireAt > Date.now()) {
    return cached.payload
  }

  try {
    const payload = jwt.verify(token, EFFECTIVE_JWT_SECRET) as JWTPayload
    tokenCache.set(cacheKey, { payload, expireAt: Date.now() + MEMORY_CACHE_TTL })
    // 清理过期缓存
    if (tokenCache.size > 1000) {
      const now = Date.now()
      for (const [k, v] of tokenCache) {
        if (v.expireAt < now) tokenCache.delete(k)
      }
    }
    return payload
  } catch (error) {
    return null
  }
}

// 验证JWT Token（异步版本，支持Redis缓存）
export async function verifyTokenAsync(token: string): Promise<JWTPayload | null> {
  const cacheKey = `jwt:${token.slice(-16)}`
  const cached = await cacheGet<JWTPayload>(cacheKey)
  if (cached) return cached

  try {
    const payload = jwt.verify(token, EFFECTIVE_JWT_SECRET) as JWTPayload
    await cacheSet(cacheKey, payload, 300)
    return payload
  } catch (error) {
    return null
  }
}

// 从请求头获取token
export function getTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
