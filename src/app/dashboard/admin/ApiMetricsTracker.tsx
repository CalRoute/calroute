'use client'

import { useState, useEffect } from 'react'

interface ApiStat {
  endpoint: string
  method?: string
  count: number
  avgTime: number
  minTime: number
  maxTime: number
  errorCount: number
  errorRate: number
}

interface ApiMetric {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: string
  error?: string
}

export default function ApiMetricsTracker() {
  const [stats, setStats] = useState<ApiStat[]>([])
  const [metrics, setMetrics] = useState<ApiMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState(24)

  useEffect(() => {
    loadMetrics()
  }, [hours])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/metrics?hours=${hours}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats || [])
        setMetrics(data.metrics || [])
      }
    } catch (err) {
      console.error('Failed to load metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading metrics...</div>
  }

  const slowestEndpoints = stats.sort((a, b) => b.avgTime - a.avgTime).slice(0, 5)
  const highestErrorRate = stats.filter(s => s.errorRate > 0).sort((a, b) => b.errorRate - a.errorRate)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">API Response Times</h2>
            <p className="text-sm text-gray-600 mt-1">Real-time API latency tracking</p>
          </div>
          <select
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
          >
            <option value={1}>Last 1 hour</option>
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={168}>Last 7 days</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-600 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3">Endpoint</th>
                <th className="text-right py-2 px-3">Avg (ms)</th>
                <th className="text-right py-2 px-3">Min / Max (ms)</th>
                <th className="text-right py-2 px-3">Requests</th>
                <th className="text-right py-2 px-3">Error Rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-mono text-xs text-gray-700">{stat.endpoint}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={stat.avgTime > 1000 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                      {stat.avgTime}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-600">
                    {stat.minTime} / {stat.maxTime}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-900">{stat.count}</td>
                  <td className="py-3 px-3 text-right">
                    {stat.errorRate > 0 ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                        {stat.errorRate}%
                      </span>
                    ) : (
                      <span className="text-gray-500">0%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stats.length === 0 && (
          <p className="text-center py-8 text-gray-500">No API metrics available</p>
        )}
      </div>

      {slowestEndpoints.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Slowest Endpoints</h3>
          <div className="space-y-2">
            {slowestEndpoints.map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-mono text-sm text-gray-900">{stat.endpoint}</p>
                  <p className="text-xs text-gray-600 mt-1">{stat.count} requests</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${stat.avgTime > 1000 ? 'text-red-600' : 'text-orange-600'}`}>
                    {stat.avgTime}ms avg
                  </p>
                  <p className="text-xs text-gray-600">up to {stat.maxTime}ms</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {highestErrorRate.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoints with Errors</h3>
          <div className="space-y-2">
            {highestErrorRate.map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="font-mono text-sm text-gray-900">{stat.endpoint}</p>
                  <p className="text-xs text-gray-600 mt-1">{stat.errorCount} errors out of {stat.count} requests</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-700">{stat.errorRate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
