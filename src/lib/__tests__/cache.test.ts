import { memoryCache, CACHE_KEYS, CACHE_TTL } from '../cache'

describe('MemoryCache', () => {
  beforeEach(() => {
    memoryCache.clear()
  })

  it('should set and get values', () => {
    memoryCache.set('test-key', { value: 'test-data' })
    const result = memoryCache.get('test-key')
    expect(result).toEqual({ value: 'test-data' })
  })

  it('should return null for missing keys', () => {
    const result = memoryCache.get('non-existent')
    expect(result).toBeNull()
  })

  it('should expire entries after TTL', async () => {
    memoryCache.set('test-key', 'value', 0.1) // 100ms TTL
    expect(memoryCache.get('test-key')).toBe('value')

    await new Promise(resolve => setTimeout(resolve, 150))
    expect(memoryCache.get('test-key')).toBeNull()
  })

  it('should check if key exists', () => {
    memoryCache.set('test-key', 'value')
    expect(memoryCache.has('test-key')).toBe(true)
    expect(memoryCache.has('non-existent')).toBe(false)
  })

  it('should delete keys', () => {
    memoryCache.set('test-key', 'value')
    expect(memoryCache.has('test-key')).toBe(true)
    memoryCache.delete('test-key')
    expect(memoryCache.has('test-key')).toBe(false)
  })

  it('should clear all entries', () => {
    memoryCache.set('key1', 'value1')
    memoryCache.set('key2', 'value2')
    memoryCache.clear()
    expect(memoryCache.get('key1')).toBeNull()
    expect(memoryCache.get('key2')).toBeNull()
  })
})

describe('Cache Keys', () => {
  it('should generate correct cache keys', () => {
    const userId = 'test-uid'
    expect(CACHE_KEYS.USER(userId)).toBe('user:test-uid')
    expect(CACHE_KEYS.BOOKING_LINK('link-1')).toBe('link:link-1')
    expect(CACHE_KEYS.BOOKINGS_FOR_USER(userId)).toBe('bookings:test-uid')
  })
})

describe('Cache TTL', () => {
  it('should have correct TTL values', () => {
    expect(CACHE_TTL.SHORT).toBe(5 * 60)
    expect(CACHE_TTL.MEDIUM).toBe(15 * 60)
    expect(CACHE_TTL.LONG).toBe(60 * 60)
    expect(CACHE_TTL.VERY_LONG).toBe(24 * 60 * 60)
  })
})
