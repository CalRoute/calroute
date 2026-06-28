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
}

interface TokenHealth {
  hostId: string
  email: string
  totalCalendars: number
  expiredCount: number
  status: 'ok' | 'expired' | 'no_calendar'
}

export default function EngagementMetrics() {
  const [engagement, setEngagement] = useState<EngagementData[]>([])
  const [tokenHealth, setTokenHealth] = useState<TokenHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/engagement')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setEngagement(data.engagement || [])
          setTokenHealth(data.tokenHealth || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-8 text-gray-500">Loading engagement metrics...</div>

  const topEngagedUsers = [...engagement].sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 5)
  const expiredTokens = tokenHealth.filter(h => h.status === 'expired')
  const healthyCount = tokenHealth.filter(h => h.status === 'ok').length

  return (
    <div className="space-y-6">
      {/* User Engagement */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Users by Engagement</h2>
        {topEngagedUsers.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No booking data yet</p>
        ) : (
          <div className="space-y-2">
            {topEngagedUsers.map((user, i) => (
              <div key={user.uid} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">#{i + 1} {user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#0D7377]">{user.engagementScore}%</p>
                    <p className="text-xs text-gray-500">{user.totalBookings} bookings</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Confirmed: {user.confirmedBookings}</span>
                  <span>Cancellation rate: {user.cancellationRate}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Token Health */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Calendar Token Health</h2>
        <p className="text-sm text-gray-500 mb-4">Users with an expired Google OAuth token — calendar events will fail to create on new bookings until they reconnect.</p>
        <p className="text-sm text-gray-600 mb-3">
          Healthy: <span className="font-semibold text-green-700">{healthyCount}</span>
          {' · '}
          Expired: <span className={`font-semibold ${expiredTokens.length > 0 ? 'text-red-700' : 'text-gray-500'}`}>{expiredTokens.length}</span>
        </p>
        {expiredTokens.length === 0 ? (
          <p className="text-center py-6 text-green-600 font-medium">All calendar tokens are valid ✓</p>
        ) : (
          <div className="space-y-2">
            {expiredTokens.map(h => (
              <div key={h.hostId} className="p-4 rounded-lg border bg-red-50 border-red-200 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{h.email}</p>
                  <p className="text-sm text-gray-600">{h.expiredCount}/{h.totalCalendars} token{h.expiredCount !== 1 ? 's' : ''} expired</p>
                </div>
                <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">Token expired</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
