'use client'

interface ErrorStats {
  totalErrors: number
  criticalCount: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  emailStats: {
    total: number
    successful: number
    failed: number
    successRate: string
  }
  syncStats: {
    total: number
    successful: number
    failed: number
    successRate: string
  }
}

export default function ErrorTracking({ stats }: { stats: ErrorStats }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Error & Delivery Tracking</h2>
        <p className="text-sm text-gray-600 mt-1">System health and reliability metrics</p>
      </div>

      {/* Error Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-xl">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Last 24h Errors</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{stats.totalErrors}</p>
            <span className={`text-sm font-medium ${stats.criticalCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.criticalCount > 0 ? `${stats.criticalCount} critical` : 'All good'}
            </span>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-xl">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Error Types</p>
          <div className="space-y-1">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="text-gray-600">{type}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email Delivery */}
      <div className="p-4 bg-blue-50 rounded-xl">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Email Delivery</h3>
            <p className="text-xs text-gray-600 mt-0.5">Last 24 hours</p>
          </div>
          <span className={`text-lg font-bold ${parseFloat(stats.emailStats.successRate) > 95 ? 'text-green-600' : 'text-orange-600'}`}>
            {stats.emailStats.successRate}%
          </span>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-lg font-bold text-gray-900">{stats.emailStats.total}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Successful</p>
            <p className="text-lg font-bold text-green-600">{stats.emailStats.successful}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Failed</p>
            <p className="text-lg font-bold text-red-600">{stats.emailStats.failed}</p>
          </div>
        </div>
      </div>

      {/* Calendar Sync */}
      <div className="p-4 bg-purple-50 rounded-xl">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Calendar Sync</h3>
            <p className="text-xs text-gray-600 mt-0.5">Last 24 hours</p>
          </div>
          <span className={`text-lg font-bold ${parseFloat(stats.syncStats.successRate) > 95 ? 'text-green-600' : 'text-orange-600'}`}>
            {stats.syncStats.successRate}%
          </span>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-lg font-bold text-gray-900">{stats.syncStats.total}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Successful</p>
            <p className="text-lg font-bold text-green-600">{stats.syncStats.successful}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Failed</p>
            <p className="text-lg font-bold text-red-600">{stats.syncStats.failed}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
