'use client'

interface HealthMetrics {
  totalWebhooks: number
  failedWebhooks: number
  failureRate: string
  errorRate: string
  totalErrors: number
  lastError?: string
  health?: {
    status?: string
    calendarAPI?: string
    emailService?: string
    database?: string
    firebase?: string
  }
  emailQueue?: {
    pending: number
    empty: boolean
  }
}

export default function SystemHealth({ metrics }: { metrics: HealthMetrics }) {
  const webhookStatus = metrics.totalWebhooks === 0
    ? '— No webhooks configured'
    : metrics.failureRate === '0.0' ? '✅ No failures' : `⚠️ ${metrics.failedWebhooks} failed`

  const errorStatus = metrics.totalErrors === 0 && parseFloat(metrics.errorRate) === 0
    ? '— No API log data yet'
    : parseFloat(metrics.errorRate) < 1 ? '✅ Normal' : '⚠️ High error rate'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
        <p className="text-sm text-gray-600 mt-1">Real-time system monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Webhook Status</p>
          <p className="text-sm font-bold text-gray-900 mb-1">{webhookStatus}</p>
          <p className="text-xs text-gray-600">{metrics.failedWebhooks} failed of {metrics.totalWebhooks}</p>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">API Errors (24h)</p>
          <p className="text-sm font-bold text-gray-900 mb-1">{errorStatus}</p>
          <p className="text-xs text-gray-600">Rate: {metrics.errorRate}%</p>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email Queue</p>
          <p className="text-sm font-bold text-gray-900 mb-1">
            {metrics.emailQueue?.empty ? '✅ Empty' : `⚠️ ${metrics.emailQueue?.pending} pending`}
          </p>
          <p className="text-xs text-gray-600">Checked in last hour</p>
        </div>
      </div>

      {metrics.lastError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm font-medium text-yellow-900 mb-1">Last Error</p>
          <p className="text-xs text-yellow-800">{metrics.lastError}</p>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-3">Service Status</p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>{metrics.health?.firebase ?? '✅ Firebase: Connected'}</li>
          <li>{metrics.health?.database ?? '✅ Database: Connected'}</li>
          <li>{metrics.health?.emailService ?? '— Email service: unknown'}</li>
          <li>{metrics.health?.calendarAPI ?? '— Calendar API: not monitored'}</li>
        </ul>
        <p className="text-xs text-gray-400 mt-3">
          Uptime and response time monitoring require API middleware instrumentation.
        </p>
      </div>
    </div>
  )
}
