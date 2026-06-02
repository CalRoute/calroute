import { adminDb } from './firebase/admin'

export interface ApiMetric {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: string
  error?: string
}

export async function trackApiRequest(metric: ApiMetric) {
  try {
    await adminDb.collection('api_metrics').add({
      ...metric,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[metrics] error tracking request:', error)
  }
}

export async function getApiMetrics(hoursBack = 24) {
  try {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
    const snap = await adminDb
      .collection('api_metrics')
      .where('timestamp', '>=', since.toISOString())
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get()

    const metrics = snap.docs.map(d => d.data() as ApiMetric)

    // Calculate stats by endpoint
    const byEndpoint: Record<string, any> = {}
    metrics.forEach(m => {
      if (!byEndpoint[m.endpoint]) {
        byEndpoint[m.endpoint] = {
          endpoint: m.endpoint,
          count: 0,
          totalTime: 0,
          avgTime: 0,
          minTime: Infinity,
          maxTime: 0,
          errorCount: 0,
          errorRate: 0,
        }
      }
      const stats = byEndpoint[m.endpoint]
      stats.count++
      stats.totalTime += m.responseTime
      stats.minTime = Math.min(stats.minTime, m.responseTime)
      stats.maxTime = Math.max(stats.maxTime, m.responseTime)
      if (m.error) stats.errorCount++
    })

    // Calculate averages and rates
    Object.values(byEndpoint).forEach((stats: any) => {
      stats.avgTime = Math.round(stats.totalTime / stats.count)
      stats.errorRate = stats.count > 0 ? Math.round((stats.errorCount / stats.count) * 100) : 0
      delete stats.totalTime
    })

    return {
      metrics: metrics.slice(0, 100), // Last 100 for list view
      stats: Object.values(byEndpoint),
    }
  } catch (error) {
    console.error('[metrics] error getting metrics:', error)
    return { metrics: [], stats: [] }
  }
}

export async function getAverageLatenessBy(groupBy: 'endpoint' | 'statusCode' = 'endpoint') {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const snap = await adminDb
      .collection('api_metrics')
      .where('timestamp', '>=', since.toISOString())
      .get()

    const metrics = snap.docs.map(d => d.data() as ApiMetric)
    const grouped: Record<string, number[]> = {}

    metrics.forEach(m => {
      const key = groupBy === 'endpoint' ? m.endpoint : m.statusCode.toString()
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(m.responseTime)
    })

    const result: Record<string, { avg: number; p95: number; p99: number }> = {}
    Object.entries(grouped).forEach(([key, times]) => {
      times.sort((a, b) => a - b)
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      const p95 = times[Math.floor(times.length * 0.95)]
      const p99 = times[Math.floor(times.length * 0.99)]
      result[key] = { avg, p95, p99 }
    })

    return result
  } catch (error) {
    console.error('[metrics] error getting lateness:', error)
    return {}
  }
}
