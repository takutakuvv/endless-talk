const map = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, max = 100, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now()
  const entry = map.get(ip)
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}
