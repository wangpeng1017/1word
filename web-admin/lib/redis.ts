import { createClient, RedisClientType } from 'redis'

let redisClient: RedisClientType | null = null
let isConnecting = false

// 获取Redis客户端（懒加载）
export async function getRedisClient(): Promise<RedisClientType | null> {
  if (!process.env.REDIS_URL) return null

  if (redisClient?.isOpen) return redisClient

  if (isConnecting) {
    // 等待连接完成
    await new Promise(resolve => setTimeout(resolve, 100))
    return redisClient
  }

  try {
    isConnecting = true
    redisClient = createClient({ url: process.env.REDIS_URL })
    redisClient.on('error', (err) => console.error('Redis Error:', err))
    await redisClient.connect()
    isConnecting = false
    return redisClient
  } catch (err) {
    console.error('Redis连接失败:', err)
    isConnecting = false
    return null
  }
}

// 通用缓存获取
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await getRedisClient()
  if (!client) return null

  try {
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  } catch (err) {
    console.error('Redis GET失败:', err)
    return null
  }
}

// 通用缓存设置
export async function cacheSet(key: string, value: any, ttlSeconds = 300): Promise<void> {
  const client = await getRedisClient()
  if (!client) return

  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value))
  } catch (err) {
    console.error('Redis SET失败:', err)
  }
}

// 删除缓存
export async function cacheDelete(key: string): Promise<void> {
  const client = await getRedisClient()
  if (!client) return

  try {
    await client.del(key)
  } catch (err) {
    console.error('Redis DEL失败:', err)
  }
}

// 批量删除缓存（按前缀）
export async function cacheDeleteByPrefix(prefix: string): Promise<void> {
  const client = await getRedisClient()
  if (!client) return

  try {
    const keys = await client.keys(`${prefix}*`)
    if (keys.length > 0) {
      await client.del(keys)
    }
  } catch (err) {
    console.error('Redis批量删除失败:', err)
  }
}

// 排行榜更新（Sorted Set）
export async function updateLeaderboard(
  key: string,
  studentId: string,
  score: number
): Promise<void> {
  const client = await getRedisClient()
  if (!client) return

  try {
    await client.zAdd(key, { score, value: studentId })
  } catch (err) {
    console.error('Redis ZADD失败:', err)
  }
}

// 获取排行榜
export async function getLeaderboard(
  key: string,
  start = 0,
  end = 49
): Promise<Array<{ studentId: string; score: number; rank: number }>> {
  const client = await getRedisClient()
  if (!client) return []

  try {
    const results = await client.zRangeWithScores(key, start, end, { REV: true })
    return results.map((r, i) => ({
      studentId: r.value,
      score: r.score,
      rank: start + i + 1,
    }))
  } catch (err) {
    console.error('Redis ZRANGE失败:', err)
    return []
  }
}

// 增加积分并更新排行榜
export async function incrementLeaderboardScore(
  key: string,
  studentId: string,
  increment: number
): Promise<number> {
  const client = await getRedisClient()
  if (!client) return 0

  try {
    return await client.zIncrBy(key, increment, studentId)
  } catch (err) {
    console.error('Redis ZINCRBY失败:', err)
    return 0
  }
}

// 检查Redis是否可用
export async function isRedisAvailable(): Promise<boolean> {
  const client = await getRedisClient()
  return client !== null && client.isOpen
}
