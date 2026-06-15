'use client'

import { useState, useEffect } from 'react'

interface BookingStats {
  totalBookings: number
  userCount: number
  bookingsPerUser: string
  totalUsers: number
  retentionRate: string
}

export default function RevenueAnalytics() {
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/revenue-stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Booking Activity</h2>
        <p className="text-sm text-gray-600 mt-1">Last 30 days — CalRoute is currently free, no billing data</p>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        Revenue tracking is not enabled. The metrics below reflect booking activity only — no payment system is connected.
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Confirmed Bookings (30d)</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalBookings.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Active Users (30d)</p>
            <p className="text-2xl font-bold text-gray-900">{stats.userCount}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Bookings / User</p>
            <p className="text-2xl font-bold text-gray-900">{stats.bookingsPerUser}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Retention Rate (30d)</p>
            <p className="text-2xl font-bold text-gray-900">{stats.retentionRate}%</p>
          </div>
        </div>
      )}
    </div>
  )
}
