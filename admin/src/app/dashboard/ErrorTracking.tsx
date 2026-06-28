'use client'

interface ErrorStats {
  totalErrors: number
  criticalCount: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  emailStats: { total: number; successful: number; failed: number; successRate: string }
  syncStats: { total: number; successful: number; failed: number; successRate: string }
}

export default function ErrorTracking({ stats }: { stats: ErrorStats }) {
  const hasErrors = stats.totalErrors > 0
  const errorTypes = Object.entries(stats.byType)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Error Tracking</h2>
        <p className="text-xs text-gray-400 mt-0.5">Errors logged in the last 24 hours</p>
      </div>

      <div className="flex items-center gap-4">
        <p className={`text-5xl font-bold ${hasErrors ? 'text-red-600' : 'text-gray-900'}`}>
          {stats.totalErrors}
        </p>
        <div>
          <p className={`text-sm font-medium ${stats.criticalCount > 0 ? 'text-red-600' : hasErrors ? 'text-amber-600' : 'text-green-600'}`}>
            {stats.criticalCount > 0 ? `${stats.criticalCount} critical` : hasErrors ? 'No critical errors' : 'All good'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">errors in last 24h</p>
        </div>
      </div>

      {errorTypes.length > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-2">
          {errorTypes.map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-mono">{type}</span>
              <span className="text-sm font-semibold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
