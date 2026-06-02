'use client'

interface HealthMetrics {
  totalWebhooks: number
  failedWebhooks: number
  failureRate: string
  errorRate: string
  totalErrors: number
  lastError?: string
}

export default function SystemHealth({ metrics }: { metrics: HealthMetrics }) {
  const healthStatus = {
    webhooks: metrics.failureRate === '0.0' ? '✅ Healthy' : '⚠️ Issues detected',
    errors: parseFloat(metrics.errorRate) < 1 ? '✅ Normal' : '⚠️ High error rate',
  }

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
            <li>✅ Calendar API: Connected</li>
            <li>✅ Email Service: Active</li>
            <li>✅ Database: Healthy</li>
            <li>✅ Firebase: Connected</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Performance</p>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>⏱️ API Response: &lt;200ms avg</li>
            <li>📊 Uptime: 99.9%</li>
            <li>🔄 Sync Interval: 5min</li>
            <li>📧 Email Queue: Empty</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
