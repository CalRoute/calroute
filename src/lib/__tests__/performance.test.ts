import { debounce, throttle, PerformanceMonitor } from '../performance'

describe('debounce', () => {
  jest.useFakeTimers()

  it('should debounce function calls', () => {
    const mockFn = jest.fn()
    const debounced = debounce(mockFn, 300)

    debounced()
    debounced()
    debounced()

    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(300)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should pass arguments to debounced function', () => {
    const mockFn = jest.fn()
    const debounced = debounce(mockFn, 300)

    debounced('test', 123)
    jest.advanceTimersByTime(300)

    expect(mockFn).toHaveBeenCalledWith('test', 123)
  })
})

describe('throttle', () => {
  jest.useFakeTimers()

  it('should throttle function calls', () => {
    const mockFn = jest.fn()
    const throttled = throttle(mockFn, 300)

    throttled()
    throttled()
    throttled()

    expect(mockFn).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(300)
    throttled()
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})

describe('PerformanceMonitor', () => {
  it('should mark and measure performance', () => {
    const monitor = new PerformanceMonitor()

    monitor.mark('start')
    setTimeout(() => {
      monitor.measure('operation', 'start')
    }, 100)

    jest.runAllTimers()

    const measurements = monitor.getMeasurements()
    expect(measurements.length).toBeGreaterThan(0)
    expect(measurements[0].name).toBe('operation')
  })

  it('should return 0 for non-existent mark', () => {
    const monitor = new PerformanceMonitor()
    const duration = monitor.measure('test', 'non-existent')
    expect(duration).toBe(0)
  })

  it('should calculate average duration', () => {
    const monitor = new PerformanceMonitor()

    monitor.mark('start1')
    monitor.measure('test', 'start1')

    monitor.mark('start2')
    monitor.measure('test', 'start2')

    const avg = monitor.getAverageDuration('test')
    expect(avg).toBeGreaterThan(0)
  })

  it('should clear measurements', () => {
    const monitor = new PerformanceMonitor()
    monitor.mark('start')
    monitor.measure('test', 'start')

    expect(monitor.getMeasurements().length).toBeGreaterThan(0)

    monitor.clear()
    expect(monitor.getMeasurements().length).toBe(0)
  })
})
