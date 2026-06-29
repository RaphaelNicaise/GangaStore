import { getRedisClient } from "@/lib/redis"

export async function cacheGetJSON<T>(key: string): Promise<T | null> {
  const redis = getRedisClient()
  if (!redis) return null

  try {
    await redis.connect()
  } catch {
    return null
  }

  try {
    const raw = await redis.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function cacheSetJSON<T>(key: string, value: T, ttlSeconds = 120) {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.connect()
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds)
  } catch {
    // No-op to preserve app behavior without Redis.
  }
}

export async function cacheDelete(key: string) {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.connect()
    await redis.del(key)
  } catch {
    // No-op to preserve app behavior without Redis.
  }
}

export async function cacheDeleteByPrefix(prefix: string) {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.connect()

    let cursor = "0"
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100)
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== "0")
  } catch {
    // No-op to preserve app behavior without Redis.
  }
}

export function toCacheQueryKey(searchParams: URLSearchParams) {
  const sorted = [...searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    if (leftKey === rightKey) return leftValue.localeCompare(rightValue)
    return leftKey.localeCompare(rightKey)
  })

  return sorted.map(([key, value]) => `${key}=${value}`).join("&")
}
