interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlSeconds = 3600) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const memoryCache = new MemoryCache()

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => memoryCache.cleanup(), 5 * 60 * 1000)
}

// Cache decorator for async functions
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds = 3600
): () => Promise<T> {
  return async () => {
    const cached = memoryCache.get<T>(key)
    if (cached) return cached

    const result = await fn()
    memoryCache.set(key, result, ttlSeconds)
    return result
  }
}

// Cache keys
export const CACHE_KEYS = {
  // User data (1 hour)
  USER: (uid: string) => `user:${uid}`,
  USER_ROLE: (uid: string) => `user_role:${uid}`,
  USER_PROFILE: (uid: string) => `user_profile:${uid}`,

  // Booking data (15 minutes)
  BOOKINGS_FOR_USER: (uid: string) => `bookings:${uid}`,
  BOOKING: (id: string) => `booking:${id}`,

  // Link data (1 hour)
  BOOKING_LINK: (id: string) => `link:${id}`,
  BOOKING_LINKS_FOR_USER: (uid: string) => `links:${uid}`,

  // Calendar data (10 minutes)
  CALENDARS_FOR_USER: (uid: string) => `calendars:${uid}`,
  AVAILABILITY: (uid: string) => `availability:${uid}`,

  // Analytics (30 minutes)
  BOOKING_ANALYTICS: () => 'analytics:bookings',
  USER_ENGAGEMENT: () => 'analytics:engagement',
  FEATURE_USAGE: () => 'analytics:features',

  // Admin data (5 minutes)
  ADMIN_METRICS: () => 'admin:metrics',
  ADMIN_USERS: () => 'admin:users',
}

export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 15 * 60, // 15 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60, // 24 hours
}
