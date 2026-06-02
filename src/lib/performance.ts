// Performance monitoring and optimization utilities

export class PerformanceMonitor {
  private marks = new Map<string, number>()
  private measurements: Array<{ name: string; duration: number }> = []

  mark(name: string) {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string) {
    const startTime = this.marks.get(startMark)
    if (!startTime) {
      console.warn(`Mark "${startMark}" not found`)
      return 0
    }

    const duration = performance.now() - startTime
    this.measurements.push({ name, duration })

    if (duration > 1000) {
      console.warn(`[perf] ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  getMeasurements() {
    return this.measurements
  }

  getAverageDuration(name: string) {
    const measurements = this.measurements.filter(m => m.name === name)
    if (measurements.length === 0) return 0

    const total = measurements.reduce((a, b) => a + b.duration, 0)
    return total / measurements.length
  }

  clear() {
    this.marks.clear()
    this.measurements = []
  }
}

export const monitor = new PerformanceMonitor()

// Debounce function for API calls
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delayMs)
  }
}

// Throttle function for event handlers
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delayMs) {
      lastCall = now
      fn(...args)
    }
  }
}

// Batch operations to reduce API calls
export class BatchProcessor<T, R> {
  private queue: T[] = []
  private processing = false
  private batchSize: number
  private delayMs: number
  private processor: (items: T[]) => Promise<R[]>

  constructor(processor: (items: T[]) => Promise<R[]>, batchSize = 10, delayMs = 100) {
    this.processor = processor
    this.batchSize = batchSize
    this.delayMs = delayMs
  }

  add(item: T) {
    this.queue.push(item)
    if (this.queue.length >= this.batchSize) {
      this.flush()
    } else {
      this.scheduleFlush()
    }
  }

  private scheduleFlush() {
    if (this.processing) return

    setTimeout(() => {
      if (this.queue.length > 0) {
        this.flush()
      }
    }, this.delayMs)
  }

  async flush() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const items = this.queue.splice(0, this.batchSize)

    try {
      await this.processor(items)
    } catch (error) {
      console.error('[batch] error processing:', error)
      // Re-add failed items to queue
      this.queue.unshift(...items)
    } finally {
      this.processing = false

      if (this.queue.length > 0) {
        this.scheduleFlush()
      }
    }
  }
}

// Lazy loading utilities
export function observeElement(element: Element, callback: () => void) {
  if (!('IntersectionObserver' in window)) {
    callback()
    return
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback()
        observer.unobserve(entry.target)
      }
    })
  })

  observer.observe(element)
}

// Image optimization helpers
export function optimizeImageUrl(url: string, width: number, quality = 80): string {
  // Use Cloudinary or similar service for optimization
  // This is a placeholder
  return url
}

// Connection speed detection
export function getConnectionSpeed(): 'slow' | 'fast' {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    if (connection && connection.effectiveType) {
      return ['slow-2g', '2g', '3g'].includes(connection.effectiveType) ? 'slow' : 'fast'
    }
  }
  return 'fast'
}
