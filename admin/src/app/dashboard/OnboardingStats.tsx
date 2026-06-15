'use client'

import { useState, useEffect } from 'react'

interface OnboardingData {
  totalStarted: number
  completed: number
  inProgress: number
  skipped: number
  completionRate: string
  averageTimeToComplete: string
  profileSetupRate: string
  calendarConnectedRate: string
  bookingLinkCreatedRate: string
  firstBookingRate: string
}

export default function OnboardingStats() {
  const [stats, setStats] = useState<OnboardingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/onboarding-stats')
      if (!res.ok) throw new Error('Failed to load onboarding stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
      setError('Failed to load onboarding stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading onboarding stats...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  if (!stats) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Onboarding Progress</h2>
        <p className="text-sm text-gray-600 mt-1">New user onboarding funnel analytics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-700">Started</p>
          <p className="text-2xl font-bold text-blue-900">{stats.totalStarted}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-700">Completed</p>
          <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-sm text-orange-700">In Progress</p>
          <p className="text-2xl font-bold text-orange-900">{stats.inProgress}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-700">Skipped</p>
          <p className="text-2xl font-bold text-red-900">{stats.skipped}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Funnel</h3>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">1. Profile Setup</span>
            <span className="text-sm text-gray-600">{stats.profileSetupRate}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#0D7377]" style={{ width: `${stats.profileSetupRate}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">2. Calendar Connected</span>
            <span className="text-sm text-gray-600">{stats.calendarConnectedRate}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#0D7377]" style={{ width: `${stats.calendarConnectedRate}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">3. Booking Link Created</span>
            <span className="text-sm text-gray-600">{stats.bookingLinkCreatedRate}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#0D7377]" style={{ width: `${stats.bookingLinkCreatedRate}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">4. First Booking</span>
            <span className="text-sm text-gray-600">{stats.firstBookingRate}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#0D7377]" style={{ width: `${stats.firstBookingRate}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
        <div>
          <p className="text-sm text-gray-600">Completion Rate</p>
          <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg Time to Complete</p>
          <p className="text-2xl font-bold text-gray-900">{stats.averageTimeToComplete}</p>
        </div>
      </div>
    </div>
  )
}
