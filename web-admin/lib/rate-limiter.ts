/**
 * @file 速率限制器
 * @desc 防止暴力破解的速率限制功能
 * @input 依赖: 无外部依赖（内存实现，可扩展 Redis）
 * @output 导出: RateLimiter, checkLoginRateLimit
 */

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  retryAfterMs?: number
}

export interface RateLimiterOptions {
  windowMs: number       // 时间窗口（毫秒）
  maxAttempts: number    // 最大尝试次数
}

interface AttemptRecord {
  timestamps: number[]
}

/**
 * 滑动窗口速率限制器（内存实现）
 */
export class RateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map()
  private windowMs: number
  private maxAttempts: number

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs
    this.maxAttempts = options.maxAttempts
  }

  /**
   * 检查是否允许请求
   */
  check(key: string): RateLimitResult {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // 获取或创建记录
    let record = this.attempts.get(key)
    if (!record) {
      record = { timestamps: [] }
      this.attempts.set(key, record)
    }

    // 清理过期的时间戳（滑动窗口）
    record.timestamps = record.timestamps.filter(ts => ts > windowStart)

    // 检查是否超过限制
    if (record.timestamps.length >= this.maxAttempts) {
      // 计算最早的时间戳何时过期
      const oldestTimestamp = record.timestamps[0]
      const retryAfterMs = oldestTimestamp + this.windowMs - now

      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterMs: Math.max(0, retryAfterMs),
      }
    }

    // 记录本次尝试
    record.timestamps.push(now)

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - record.timestamps.length,
    }
  }

  /**
   * 重置指定 key 的限制
   */
  reset(key: string): void {
    this.attempts.delete(key)
  }

  /**
   * 清理过期记录（可定期调用以释放内存）
   */
  cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.windowMs

    for (const [key, record] of this.attempts) {
      record.timestamps = record.timestamps.filter(ts => ts > windowStart)
      if (record.timestamps.length === 0) {
        this.attempts.delete(key)
      }
    }
  }
}

// 全局登录限制器实例
const loginRateLimiter = new RateLimiter({
  windowMs: 60000,      // 1 分钟窗口
  maxAttempts: 5,       // 最多 5 次尝试
})

// 定期清理（每 5 分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(() => loginRateLimiter.cleanup(), 5 * 60 * 1000)
}

/**
 * 检查登录速率限制
 * 同时检查 IP 和用户名两个维度
 *
 * @param ip 客户端 IP
 * @param username 登录用户名（邮箱/手机号/学号）
 * @returns 速率限制结果
 */
export async function checkLoginRateLimit(
  ip: string,
  username: string
): Promise<RateLimitResult> {
  // 检查 IP 限制
  const ipKey = `login:ip:${ip}`
  const ipResult = loginRateLimiter.check(ipKey)

  if (!ipResult.allowed) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: ipResult.retryAfterMs,
    }
  }

  // 检查用户名限制
  const usernameKey = `login:user:${username.toLowerCase()}`
  const usernameResult = loginRateLimiter.check(usernameKey)

  if (!usernameResult.allowed) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: usernameResult.retryAfterMs,
    }
  }

  // 返回两者中剩余次数较少的
  return {
    allowed: true,
    remainingAttempts: Math.min(ipResult.remainingAttempts, usernameResult.remainingAttempts),
  }
}

/**
 * 重置登录限制（登录成功后可调用）
 */
export function resetLoginRateLimit(ip: string, username: string): void {
  loginRateLimiter.reset(`login:ip:${ip}`)
  loginRateLimiter.reset(`login:user:${username.toLowerCase()}`)
}

/**
 * 重置全局登录限制器（仅用于测试）
 */
export function resetLoginRateLimiter(): void {
  ;(loginRateLimiter as any).attempts.clear()
}

/**
 * 从请求头获取客户端 IP
 */
export function getClientIp(request: Request): string {
  // 尝试从各种代理头获取真实 IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // 默认返回一个占位符（实际部署时应该有正确的 IP）
  return 'unknown'
}
