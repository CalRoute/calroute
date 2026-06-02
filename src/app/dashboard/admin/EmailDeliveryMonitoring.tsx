'use client'

import { useState, useEffect } from 'react'

interface DeliveryStatus {
  type: string
  sent: number
  delivered: number
  failed: number
  bounced: number
  successRate: string
}

export default function EmailDeliveryMonitoring() {
  const [deliveryData, setDeliveryData] = useState<DeliveryStatus[]>([])
  const [totalSent, setTotalSent] = useState(0)
  const [totalDelivered, setTotalDelivered] = useState(0)
  const [totalFailed, setTotalFailed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDeliveryData()
  }, [])

  const loadDeliveryData = async () => {
    try {
      const res = await fetch('/api/admin/email-delivery-stats')
      if (!res.ok) throw new Error('Failed to load email delivery stats')
      const data = await res.json()
      setDeliveryData(data.deliveryData)
      setTotalSent(data.totalSent)
      setTotalDelivered(data.totalDelivered)
      setTotalFailed(data.totalFailed)
    } catch (err) {
      console.error('Failed to load delivery data:', err)
      setError('Failed to load email delivery stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading delivery data...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  const overallRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Email Delivery Monitoring</h2>
        <p className="text-sm text-gray-600 mt-1">Email delivery status and performance (last 30 days)</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-700">Total Sent</p>
          <p className="text-2xl font-bold text-blue-900">{totalSent.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-700">Delivered</p>
          <p className="text-2xl font-bold text-green-900">{totalDelivered.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-700">Failed</p>
          <p className="text-2xl font-bold text-red-900">{totalFailed.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-700">Success Rate</p>
          <p className="text-2xl font-bold text-purple-900">{overallRate}%</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">By Email Type</h3>
        {deliveryData.length > 0 ? (
          deliveryData.map(status => (
            <div key={status.type} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{status.type}</p>
                  <p className="text-sm text-gray-600">
                    {status.sent} sent • {status.delivered} delivered
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{parseFloat(status.successRate).toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">success rate</p>
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${status.sent > 0 ? (status.delivered / status.sent) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-gray-600">Delivered</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${status.sent > 0 ? (status.failed / status.sent) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-gray-600">Failed</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${status.sent > 0 ? (status.bounced / status.sent) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-gray-600">Bounced</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No email delivery data available</div>
        )}
      </div>
    </div>
  )
}
