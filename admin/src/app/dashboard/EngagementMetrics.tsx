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

interface RescheduleAnalytics {
  totalReschedules: number
  rescheduleRate: string
  reasonBreakdown: Record<string, number>
  peakRescheduleHour: number
}

export default function EngagementMetrics() {
  const [engagement, setEngagement] = useState<EngagementData[]>([])
  const [tokenHealth, setTokenHealth] = useState<TokenHealth[]>([])
  const [rescheduleAnalytics, setRescheduleAnalytics] = useState<RescheduleAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/admin/engagement')
      if (res.ok) {
        const data = await res.json()
        setEngagement(data.engagement || [])
        setTokenHealth(data.tokenHealth || [])
        setRescheduleAnalytics(data.rescheduleAnalytics)
      }
    } catch (err) {
      console.error('Failed to load metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading engagement metrics...</div>
  }

  const topEngagedUsers = engagement.sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 5)
  const expiredTokens = tokenHealth.filter(h => h.status === 'expired')
  const healthyCount = tokenHealth.filter(h => h.status === 'ok').length

  return (
    <div className="space-y-6">
      {/* User Engagement */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Engagement</h2>
        <div className="space-y-2">
          {topEngagedUsers.map((user, i) => (
            <div key={user.uid} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    #{i + 1} {user.name}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#0D7377]">{user.engagementScore}%</p>
                  <p className="text-xs text-gray-600">{user.totalBookings} bookings</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">Confirmed: {user.confirmedBookings}</span>
                <span className="text-gray-600">Cancellation: {user.cancellationRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Token Health */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Calendar Token Health</h2>
        <p className="text-sm text-gray-500 mb-4">Users whose Google OAuth token has expired — new bookings will fail to create calendar events until they reconnect.</p>
        <p className="text-sm text-gray-600 mb-3">
          Healthy: <span className="font-semibold text-green-700">{healthyCount}</span>
          {' · '}
          Expired: <span className={`font-semibold ${expiredTokens.length > 0 ? 'text-red-700' : 'text-gray-500'}`}>{expiredTokens.length}</span>
        </p>
        {expiredTokens.length === 0 ? (
          <p className="text-center py-8 text-green-600 font-medium">All calendar tokens are valid ✓</p>
        ) : (
          <div className="space-y-2">
            {expiredTokens.map(h => (
              <div key={h.hostId} className="p-4 rounded-lg border bg-red-50 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{h.email}</p>
                    <p className="text-sm text-gray-600">{h.expiredCount}/{h.totalCalendars} token{h.expiredCount !== 1 ? 's' : ''} expired</p>
                  </div>
                  <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">Token expired</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule Analytics */}
      {rescheduleAnalytics && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Reschedule Analytics</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-700">Total Reschedules</p>
              <p className="text-2xl font-bold text-blue-900">{rescheduleAnalytics.totalReschedules}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-700">Reschedule Rate</p>
              <p className="text-2xl font-bold text-purple-900">{rescheduleAnalytics.rescheduleRate}%</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Peak Reschedule Hour</p>
            <p className="text-3xl font-bold text-gray-900">{rescheduleAnalytics.peakRescheduleHour}:00</p>
          </div>
        </div>
      )}
    </div>
  )
}
