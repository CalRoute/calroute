'use client'

import { useState, useEffect } from 'react'

interface EmailMetric {
  templateName: string
  sent: number
  delivered: number
  deliveryRate: number
  openRate: number | null
  clickRate: number | null
}

export default function EmailTemplateAnalytics() {
  const [metrics, setMetrics] = useState<EmailMetric[]>([])
  const [totalSent, setTotalSent] = useState(0)
  const [openRateTracked, setOpenRateTracked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/email-template-stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setMetrics(data.metrics || [])
          setTotalSent(data.totalSent || 0)
          setOpenRateTracked(data.openRateTracked || false)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-8 text-gray-500">Loading email metrics...</div>

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Email Template Performance</h2>
        <p className="text-sm text-gray-600 mt-1">Delivery stats across all templates (last 30 days)</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Sent</p>
          <p className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Open / Click Tracking</p>
          <p className="text-sm font-medium text-amber-600 mt-1">Not implemented</p>
        </div>
      </div>

      {!openRateTracked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Open and click tracking require pixel/link instrumentation in email templates. Only delivery rates are available.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Template</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Sent</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Delivered</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Delivery Rate</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length > 0 ? (
              metrics.map((metric, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{metric.templateName}</td>
                  <td className="text-right py-3 px-4 text-gray-600">{metric.sent}</td>
                  <td className="text-right py-3 px-4 text-gray-600">{metric.delivered}</td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${Math.min(metric.deliveryRate, 100)}%` }} />
                      </div>
                      <span className="text-sm text-gray-700 w-12 text-right">{metric.deliveryRate}%</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">No email data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
