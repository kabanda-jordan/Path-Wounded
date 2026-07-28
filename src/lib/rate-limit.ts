interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

function cleanup(key: string, windowMs: number) {
  const entry = store.get(key)
  if (!entry) return
  const now = Date.now()
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs)
  if (entry.timestamps.length === 0) store.delete(key)
}

export function rateLimit(windowMs: number, max: number) {
  return (key: string): { allowed: boolean; remaining: number; resetMs: number } => {
    const now = Date.now()
    cleanup(key, windowMs)

    let entry = store.get(key)
    if (!entry) {
      entry = { timestamps: [] }
      store.set(key, entry)
    }

    entry.timestamps.push(now)
    const remaining = Math.max(0, max - entry.timestamps.length)
    const oldest = entry.timestamps[0] || now
    const resetMs = windowMs - (now - oldest)

    return {
      allowed: entry.timestamps.length <= max,
      remaining,
      resetMs,
    }
  }
}
