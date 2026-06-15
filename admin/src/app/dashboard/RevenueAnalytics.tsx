'use client'

import { useState, useEffect } from 'react'

interface RevenueData {
  totalBookings: number
  totalEstimatedValue: number
  averagePerDay: string
  monthlyRecurringRevenue: number
  userCount: number
  bookingsPerUser: string
  totalUsers: number
  retentionRate: string
}

export default function RevenueAnalytics() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRevenue()
  }, [])

  const loadRevenue = async () => {
    try {
      const res = await fetch('/api/admin/revenue-stats')
      if (!res.ok) throw new Error('Failed to load revenue stats')
      const data = await res.json()
      setRevenue(data)
    } catch (err) {
      console.error('Failed to load revenue data:', err)
      setError('Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading revenue data...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  if (!revenue) {
    return <div className="text-center py-8 text-gray-500">No revenue data available</div>
  }

  const projectedARR = (revenue.monthlyRecurringRevenue * 12).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Revenue Analytics</h2>
        <p className="text-sm text-gray-600 mt-1">Estimated revenue metrics (last 30 days)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-700">Total Bookings</p>
          <p className="text-2xl font-bold text-green-900">{revenue.totalBookings.toLocaleString()}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-700">Est. Revenue</p>
          <p className="text-2xl font-bold text-blue-900">${(revenue.totalEstimatedValue / 1000).toFixed(0)}K</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-700">MRR</p>
          <p className="text-2xl font-bold text-purple-900">${(revenue.monthlyRecurringRevenue / 1000).toFixed(1)}K</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-sm text-orange-700">Avg per Day</p>
          <p className="text-2xl font-bold text-orange-900">${revenue.averagePerDay}</p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-indigo-700">Active Users</p>
          <p className="text-2xl font-bold text-indigo-900">{revenue.userCount}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-700">Bookings/User</p>
          <p className="text-2xl font-bold text-red-900">{revenue.bookingsPerUser}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
        <div>
          <p className="text-sm text-gray-600">Retention Rate</p>
          <p className="text-2xl font-bold text-gray-900">{revenue.retentionRate}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Projected ARR</p>
          <p className="text-lg font-bold text-gray-900">{projectedARR}</p>
        </div>
      </div>
    </div>
  )
}
