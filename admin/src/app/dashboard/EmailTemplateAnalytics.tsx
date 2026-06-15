'use client'

import { useState, useEffect } from 'react'

interface EmailMetric {
  templateName: string
  sent: number
  openRate: number
  clickRate: number
}

export default function EmailTemplateAnalytics() {
  const [metrics, setMetrics] = useState<EmailMetric[]>([])
  const [averageOpenRate, setAverageOpenRate] = useState('0')
  const [averageClickRate, setAverageClickRate] = useState('0')
  const [totalSent, setTotalSent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/admin/email-template-stats')
      if (!res.ok) throw new Error('Failed to load email template stats')
      const data = await res.json()
      setMetrics(data.metrics)
      setAverageOpenRate(data.averageOpenRate)
      setAverageClickRate(data.averageClickRate)
      setTotalSent(data.totalSent)
    } catch (err) {
      console.error('Failed to load metrics:', err)
      setError('Failed to load email template stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading email metrics...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Email Template Performance</h2>
        <p className="text-sm text-gray-600 mt-1">Email engagement metrics across all templates (last 30 days)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Sent</p>
          <p className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Avg Open Rate</p>
          <p className="text-2xl font-bold text-teal-600">{averageOpenRate}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Avg Click Rate</p>
          <p className="text-2xl font-bold text-gray-900">{averageClickRate}%</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Template</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Sent</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Open Rate</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Click Rate</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length > 0 ? (
              metrics.map((metric, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{metric.templateName}</td>
                  <td className="text-right py-3 px-4 text-gray-600">{metric.sent}</td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${Math.min(metric.openRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700 w-12 text-right">{metric.openRate}%</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(metric.clickRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700 w-12 text-right">{metric.clickRate}%</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No email data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>Tip:</strong> Templates with higher open rates should be A/B tested for subject lines. Test different CTAs to improve click rates.
        </p>
      </div>
    </div>
  )
}
