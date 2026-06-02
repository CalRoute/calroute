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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      // Mock data for demonstration
      const mockMetrics: EmailMetric[] = [
        { templateName: 'Booking Confirmation', sent: 1245, openRate: 38.5, clickRate: 12.3 },
        { templateName: 'Booking Reminder', sent: 956, openRate: 45.2, clickRate: 18.7 },
        { templateName: 'Cancellation Notice', sent: 124, openRate: 28.3, clickRate: 5.2 },
        { templateName: 'Reschedule Confirmation', sent: 342, openRate: 41.8, clickRate: 14.5 },
        { templateName: 'Welcome Email', sent: 89, openRate: 52.1, clickRate: 22.3 },
      ]
      setMetrics(mockMetrics)
    } catch (err) {
      console.error('Failed to load metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading email metrics...</div>
  }

  const averageOpenRate = (metrics.reduce((a, b) => a + b.openRate, 0) / metrics.length).toFixed(1)
  const averageClickRate = (metrics.reduce((a, b) => a + b.clickRate, 0) / metrics.length).toFixed(1)
  const totalSent = metrics.reduce((a, b) => a + b.sent, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Email Template Performance</h2>
        <p className="text-sm text-gray-600 mt-1">Email engagement metrics across all templates</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-700">Total Sent</p>
          <p className="text-2xl font-bold text-blue-900">{totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-700">Avg Open Rate</p>
          <p className="text-2xl font-bold text-green-900">{averageOpenRate}%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-700">Avg Click Rate</p>
          <p className="text-2xl font-bold text-purple-900">{averageClickRate}%</p>
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
            {metrics.map((metric, i) => (
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
            ))}
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
