export async function cacheGetJSON<T>(key: string): Promise<T | null> {
  return null
}

export async function cacheSetJSON<T>(key: string, value: T, ttlSeconds = 120) {
  // No-op
}

export async function cacheDelete(key: string) {
  // No-op
}

export async function cacheDeleteByPrefix(prefix: string) {
  // No-op
}

export function toCacheQueryKey(searchParams: URLSearchParams) {
  const sorted = [...searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    if (leftKey === rightKey) return leftValue.localeCompare(rightValue)
    return leftKey.localeCompare(rightKey)
  })

  return sorted.map(([key, value]) => `${key}=${value}`).join("&")
}
