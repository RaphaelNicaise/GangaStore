interface Entry {
  count: number
  resetAt: number
}

// In-memory store — funciona en desarrollo/Docker (single process)
// Para producción multi-instancia usar Redis (@upstash/ratelimit)
const store = new Map<string, Entry>()

export function rateLimit(
  identifier: string,
  limit = 60,
  windowMs = 60_000,
): { success: boolean; remaining: number; retryAfter: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, retryAfter: 0 }
}

// Limpia entradas expiradas cada 5 minutos para no acumular memoria
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, 5 * 60_000)
}
