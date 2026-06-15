'use client'

import { useState, useEffect } from 'react'

interface OnboardingData {
  totalUsers: number
  calendarConnectedCount: number
  bookingLinkCreatedCount: number
  firstBookingCount: number
  calendarConnectedRate: string
  bookingLinkCreatedRate: string
  firstBookingRate: string
  avgTimeToFirstBooking: string
}

export default function OnboardingStats() {
  const [stats, setStats] = useState<OnboardingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/onboarding-stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-8 text-gray-500">Loading onboarding stats...</div>
  if (!stats) return null

  const funnel = [
    { label: 'Calendar Connected', rate: stats.calendarConnectedRate, count: stats.calendarConnectedCount },
    { label: 'Booking Link Created', rate: stats.bookingLinkCreatedRate, count: stats.bookingLinkCreatedCount },
    { label: 'First Booking Received', rate: stats.firstBookingRate, count: stats.firstBookingCount },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Onboarding Funnel</h2>
        <p className="text-sm text-gray-600 mt-1">Out of {stats.totalUsers} total users</p>
      </div>

      <div className="space-y-4">
        {funnel.map((step, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">{i + 1}. {step.label}</span>
              <span className="text-sm text-gray-600">{step.count} ({step.rate}%)</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#0D7377]" style={{ width: `${step.rate}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm text-gray-600">Avg time to first booking</p>
        <p className="text-xl font-bold text-gray-900">{stats.avgTimeToFirstBooking}</p>
      </div>
    </div>
  )
}
