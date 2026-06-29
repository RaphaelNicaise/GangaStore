import Redis from "ioredis"

let redisClient: Redis | null = null

export function getRedisClient() {
  if (redisClient) return redisClient

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
  })

  redisClient.on("error", () => {
    // Keep the app resilient if Redis is temporarily unavailable.
  })

  return redisClient
}
