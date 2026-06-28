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
  deadLinks: { id: string; title: string; slug: string }[]
  deadLinkCount: number
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
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Peak Hours Bookings Are Made</h3>
        {data.peakHours.length === 0 ? (
          <p className="text-sm text-gray-500">No booking data yet</p>
        ) : (
          <div className="flex items-end gap-3">
            {data.peakHours.map((h, i) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-700">{h.count}</span>
                <div
                  className={`w-full rounded-t ${i === 0 ? 'bg-[#0D7377]' : 'bg-[#0D7377]/40'}`}
                  style={{ height: `${Math.max(24, (h.count / data.peakHours[0].count) * 80)}px` }}
                />
                <span className="text-xs text-gray-500">{fmt12h(h.hour)}</span>
                {i === 0 && <span className="text-xs text-[#0D7377] font-medium">peak</span>}
              </div>
            ))}
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

      {/* Dead links */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Inactive Booking Links</h3>
            <p className="text-xs text-gray-400 mt-0.5">Active links with no bookings in the last 30 days</p>
          </div>
          <span className={`text-2xl font-bold ${data.deadLinkCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {data.deadLinkCount} <span className="text-sm font-normal text-gray-400">/ {data.totalActiveLinks}</span>
          </span>
        </div>
        {data.deadLinks.length === 0 ? (
          <p className="text-sm text-green-600 font-medium">All active links had bookings in the last 30 days ✓</p>
        ) : (
          <div className="space-y-2">
            {data.deadLinks.map(l => (
              <div key={l.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{l.title}</p>
                  <p className="text-xs text-gray-400">/book/{l.slug}</p>
                </div>
                <span className="text-xs text-gray-400">No bookings 30d</span>
              </div>
            ))}
            {data.deadLinkCount > data.deadLinks.length && (
              <p className="text-xs text-gray-400 text-center">+{data.deadLinkCount - data.deadLinks.length} more</p>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
