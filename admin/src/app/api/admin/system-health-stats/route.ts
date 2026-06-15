import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Count webhook failures from error_logs (written by webhooks.ts on delivery failure)
    const errorLogsSnap = await adminDb.collection('error_logs').get()
    const allErrorLogs = errorLogsSnap.docs.map(d => d.data())
    const webhookFailures = allErrorLogs.filter(l =>
      l.errorType === 'webhook_delivery' && new Date(l.timestamp) >= twentyFourHoursAgo
    )

    const totalWebhooksSnap = await adminDb.collectionGroup('webhooks').get()
    const totalWebhooks = totalWebhooksSnap.size
    const failedWebhooks = webhookFailures.length
    const failureRate = totalWebhooks > 0 ? ((failedWebhooks / totalWebhooks) * 100).toFixed(1) : '0.0'

    // api_metrics is the correct collection (written by api-metrics.ts trackApiRequest)
    const apiMetricsSnap = await adminDb.collection('api_metrics').get()
    const allMetrics = apiMetricsSnap.docs.map(d => d.data())

    const recentMetrics = allMetrics.filter(m => {
      const t = new Date(m.timestamp || 0)
      return t >= twentyFourHoursAgo
    })

    const totalRequests = recentMetrics.length
    const errorCount = recentMetrics.filter(m => (m.statusCode ?? m.status ?? 0) >= 400).length
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + (m.responseTime ?? m.duration ?? 0), 0)
    const cacheHits = recentMetrics.filter(m => m.cached).length

    const avgResponseTime = totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0
    const cacheHitRate = totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0
    const errorRate = totalRequests > 0 ? ((errorCount / totalRequests) * 100) : 0

    // Pending emails from delivery_logs
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    const deliverySnap = await adminDb.collection('delivery_logs').get()
    const pendingEmails = deliverySnap.docs
      .map(d => d.data())
      .filter(l => l.type === 'email' && l.status === 'pending' && new Date(l.timestamp) >= oneHourAgo)
      .length

    // DB size estimate from doc count
    const collections = ['hosts', 'bookings', 'booking_links', 'delivery_logs', 'api_metrics']
    let totalDocuments = 0
    await Promise.all(collections.map(async col => {
      const snap = await adminDb.collection(col).get()
      totalDocuments += snap.size
    }))
    const databasePercentage = Math.min(100, Math.round((totalDocuments / 1048576) * 100))

    return Response.json({
      webhooks: { totalWebhooks, failedWebhooks, failureRate },
      api: { totalRequests, errorCount, errorRate: errorRate.toFixed(2), avgResponseTime },
      performance: {
        cacheHitRate: totalRequests > 0 ? cacheHitRate : null,
        avgResponseTime: totalRequests > 0 ? avgResponseTime : null,
        uptime: null,
      },
      capacity: {
        databaseSize: databasePercentage,
        apiRateLimit: null,
      },
      health: {
        status: totalRequests === 0 ? '— No API data yet' : errorRate < 1 ? '✅ Healthy' : '⚠️ Issues detected',
        emailService: pendingEmails === 0 ? '✅ No pending emails' : `⚠️ ${pendingEmails} pending`,
        database: '✅ Connected',
        firebase: '✅ Connected',
        calendarAPI: '— Not monitored',
      },
      emailQueue: { pending: pendingEmails, empty: pendingEmails === 0 },
    })
  } catch (error) {
    console.error('[admin] system health stats error:', error)
    return Response.json({ error: 'Failed to load system health stats' }, { status: 500 })
  }
}
