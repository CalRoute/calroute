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

interface SyncStatus {
  hostId: string
  email: string
  totalCalendars: number
  syncedCalendars: number
  lastSyncMinutesAgo: number
  syncStatus: 'synced' | 'stale' | 'outdated'
}

interface RescheduleAnalytics {
  totalReschedules: number
  rescheduleRate: string
  reasonBreakdown: Record<string, number>
  peakRescheduleHour: number
}

export default function EngagementMetrics() {
  const [engagement, setEngagement] = useState<EngagementData[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([])
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
        setSyncStatus(data.syncStatus || [])
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
  const outOfSyncCalendars = syncStatus.filter(s => s.syncStatus !== 'synced')

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

      {/* Calendar Sync Status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendar Sync Status</h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-3">Synced: {syncStatus.filter(s => s.syncStatus === 'synced').length} / {syncStatus.length}</p>
          {outOfSyncCalendars.length === 0 ? (
            <p className="text-center py-8 text-green-600 font-medium">All calendars synced ✓</p>
          ) : (
            outOfSyncCalendars.map(sync => (
              <div key={sync.hostId} className={`p-4 rounded-lg border ${
                sync.syncStatus === 'stale' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{sync.email}</p>
                    <p className="text-sm text-gray-600">{sync.syncedCalendars}/{sync.totalCalendars} calendars synced</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${sync.syncStatus === 'stale' ? 'text-yellow-700' : 'text-red-700'}`}>
                      {sync.lastSyncMinutesAgo}m ago
                    </p>
                    <p className="text-xs text-gray-600">{sync.syncStatus}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
