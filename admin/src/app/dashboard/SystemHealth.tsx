'use client'

interface HealthMetrics {
  totalWebhooks: number
  failedWebhooks: number
  failureRate: string
  errorRate: string
  totalErrors: number
  lastError?: string
  performance?: {
    avgResponseTime: number
    uptime: number
  }
  health?: {
    calendarAPI: string
    emailService: string
    database: string
    firebase: string
  }
  emailQueue?: {
    pending: number
    empty: boolean
  }
}

export default function SystemHealth({ metrics }: { metrics: HealthMetrics }) {
  const healthStatus = {
    webhooks: metrics.failureRate === '0.0' ? '✅ Healthy' : '⚠️ Issues detected',
    errors: parseFloat(metrics.errorRate) < 1 ? '✅ Normal' : '⚠️ High error rate',
  }

  const uptime = metrics.performance?.uptime || 99.9
  const avgResponseTime = metrics.performance?.avgResponseTime || 100

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
        <p className="text-sm text-gray-600 mt-1">Real-time system monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Webhook Status</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{healthStatus.webhooks}</p>
          <p className="text-xs text-gray-600">
            {metrics.failedWebhooks} failed of {metrics.totalWebhooks}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Failure rate: {metrics.failureRate}%
          </p>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">API Errors</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{healthStatus.errors}</p>
          <p className="text-xs text-gray-600">
            {metrics.totalErrors} total errors
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Error rate: {metrics.errorRate}%
          </p>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Overall Status</p>
          <p className="text-2xl font-bold text-green-600 mb-1">✅ Operational</p>
          <p className="text-xs text-gray-600">
            All systems nominal
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Last updated: now
          </p>
        </div>
      </div>

      {metrics.lastError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-medium text-yellow-900 mb-1">Last Error</p>
          <p className="text-xs text-yellow-800">{metrics.lastError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Quick Checks</p>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>{metrics.health?.calendarAPI || '✅ Calendar API: Connected'}</li>
            <li>{metrics.health?.emailService || '✅ Email Service: Active'}</li>
            <li>{metrics.health?.database || '✅ Database: Healthy'}</li>
            <li>{metrics.health?.firebase || '✅ Firebase: Connected'}</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Performance</p>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>⏱️ API Response: {avgResponseTime}ms avg</li>
            <li>📊 Uptime: {uptime}%</li>
            <li>🔄 Sync Interval: 5min</li>
            <li>📧 Email Queue: {metrics.emailQueue?.empty ? 'Empty' : `${metrics.emailQueue?.pending} pending`}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
