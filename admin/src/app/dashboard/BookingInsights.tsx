'use client'

import { useState, useEffect } from 'react'

interface InsightsData {
  cancellationRate: number
  totalConfirmed: number
  totalCancelled: number
  lateCancelRate: number
  lateCancelCount: number
  peakHours: { hour: number; count: number }[]
  churnedUsers: { uid: string; email: string; name: string }[]
  churnedCount: number
  totalActiveLinks: number
}

function fmt12h(hour: number) {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

export default function BookingInsights() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/booking-insights')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">Loading insights…</p>
    </div>
  )
  if (!data) return null

  return (
    <div className="space-y-5">

      {/* Cancellation & late cancel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Cancellation Rate</h3>
          <p className={`text-4xl font-bold mb-1 ${data.cancellationRate > 20 ? 'text-red-600' : data.cancellationRate > 10 ? 'text-amber-600' : 'text-green-600'}`}>
            {data.cancellationRate}%
          </p>
          <p className="text-sm text-gray-500">{data.totalCancelled} cancelled of {data.totalConfirmed + data.totalCancelled} total</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Late Cancellations</h3>
          <p className={`text-4xl font-bold mb-1 ${data.lateCancelRate > 30 ? 'text-red-600' : data.lateCancelRate > 10 ? 'text-amber-600' : 'text-green-600'}`}>
            {data.lateCancelRate}%
          </p>
          <p className="text-sm text-gray-500">{data.lateCancelCount} cancelled within 24h of start time</p>
        </div>
      </div>

      {/* Peak booking hours */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Peak hours bookings are made</h3>
        <p className="text-xs text-gray-400 mb-5">Top 3 hours when guests submit bookings</p>
        {data.peakHours.length === 0 ? (
          <p className="text-sm text-gray-500">No booking data yet</p>
        ) : (
          <div className="space-y-3">
            {data.peakHours.map((h, i) => {
              const pct = Math.round((h.count / data.peakHours[0].count) * 100)
              return (
                <div key={h.hour} className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-10 text-right flex-shrink-0">{fmt12h(h.hour)}</span>
                  <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: i === 0 ? '#0D7377' : i === 1 ? '#0D737799' : '#0D737755',
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 flex-shrink-0">
                    {h.count} <span className="text-xs font-normal text-gray-400">booking{h.count !== 1 ? 's' : ''}</span>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Churned users */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">At-Risk Users</h3>
            <p className="text-xs text-gray-400 mt-0.5">Active 30–60 days ago, no activity in last 30 days</p>
          </div>
          <span className={`text-2xl font-bold ${data.churnedCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {data.churnedCount}
          </span>
        </div>
        {data.churnedUsers.length === 0 ? (
          <p className="text-sm text-green-600 font-medium">No at-risk users ✓</p>
        ) : (
          <div className="space-y-2">
            {data.churnedUsers.map(u => (
              <div key={u.uid} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className="text-xs text-amber-700 font-medium">No activity 30d</span>
              </div>
            ))}
            {data.churnedCount > data.churnedUsers.length && (
              <p className="text-xs text-gray-400 text-center">+{data.churnedCount - data.churnedUsers.length} more</p>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
