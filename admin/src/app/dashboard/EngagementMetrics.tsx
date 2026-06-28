'use client'

import { useState, useEffect } from 'react'

interface EngagementData {
  uid: string
  email: string
  name: string
  totalBookings: number
  confirmedBookings: number
  cancellationRate: string
  engagementScore: number
  lastBookingAt: string | null
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function EngagementMetrics() {
  const [engagement, setEngagement] = useState<EngagementData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/engagement')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setEngagement(data.engagement || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">Loading engagement metrics...</p>
    </div>
  )

  const sorted = [...engagement].sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 10)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">User Engagement</h2>
      <p className="text-xs text-gray-400 mb-5">Based on bookings in the last 30 days</p>

      {sorted.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No booking data yet</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((user, i) => (
            <div key={user.uid} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-sm font-semibold text-gray-300 w-5 flex-shrink-0">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-700">{user.confirmedBookings} bookings</p>
                <p className="text-xs text-gray-400">
                  {user.lastBookingAt ? timeAgo(user.lastBookingAt) : 'No bookings'}
                </p>
              </div>
              <div className="w-12 text-right flex-shrink-0">
                <p className={`text-lg font-bold ${user.engagementScore >= 75 ? 'text-green-600' : user.engagementScore >= 40 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {user.engagementScore}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
