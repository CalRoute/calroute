export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { getUserBilling } from '@/lib/billing/get-user-billing'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { startOfMonth, startOfYear, endOfYear, parseISO, format } from 'date-fns'
import AnalyticsExportButton from './AnalyticsExportButton'

export default async function AnalyticsPage() {
  const user = await requireUser('/dashboard/analytics')

  const [hostSnap, billing] = await Promise.all([
    adminDb.collection('hosts').doc(user.uid).get(),
    getUserBilling(user.uid),
  ])
  const host = hostSnap.data()

  if (billing.isFree) {
    return (
      <DashboardLayout
        user={{ email: user.email, name: host?.name }}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]}
      >
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-14 h-14 bg-[#0D7377]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analytics is a paid feature</h2>
          <p className="text-sm text-gray-500 max-w-sm mb-6">Upgrade to Solo to unlock booking trends, peak hours, link performance, and more.</p>
          <Link
            href="/dashboard/settings?tab=billing"
            className="inline-flex items-center gap-2 bg-[#0D7377] text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-[#0a5f63] transition-colors"
          >
            Upgrade to Solo →
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  // Fetch all bookings
  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('hostId', '==', user.uid)
    .get()

  const allBookings = bookingsSnap.docs
    .map(d => ({ id: d.id, ...d.data() })) as any[]

  // Month-by-month breakdown for current year
  const yearStart = startOfYear(new Date())
  const yearEnd = endOfYear(new Date())

  const monthlyStats: { month: string; count: number }[] = []
  for (let i = 0; i < 12; i++) {
    const monthStart = startOfMonth(new Date(new Date().getFullYear(), i, 1))
    const count = allBookings.filter(b => {
      const d = parseISO(b.startTime)
      return d.getFullYear() === new Date().getFullYear() && d.getMonth() === i && b.status === 'confirmed'
    }).length
    monthlyStats.push({
      month: format(monthStart, 'MMM'),
      count,
    })
  }

  // Status breakdown
  const confirmed = allBookings.filter(b => b.status === 'confirmed').length
  const cancelled = allBookings.filter(b => b.status === 'cancelled').length
  const rescheduled = allBookings.filter(b => b.status === 'rescheduled').length
  const total = allBookings.length

  const confirmedPct = total > 0 ? Math.round((confirmed / total) * 100) : 0
  const cancelledPct = total > 0 ? Math.round((cancelled / total) * 100) : 0
  const rescheduledPct = total > 0 ? Math.round((rescheduled / total) * 100) : 0

  const maxMonthlyCount = Math.max(...monthlyStats.map(m => m.count), 1)

  // Peak booking times (hours)
  const hourCounts: { [key: number]: number } = {}
  allBookings.forEach(b => {
    if (b.status === 'confirmed') {
      const hour = parseISO(b.startTime).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }
  })
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  const maxHourCount = Math.max(...peakHours.map(h => h.count), 1)

  // Booking link performance
  const linkCounts: { [key: string]: number } = {}
  const linkTitles: { [key: string]: string } = {}
  allBookings.forEach(b => {
    if (b.status === 'confirmed') {
      linkCounts[b.bookingLinkId] = (linkCounts[b.bookingLinkId] || 0) + 1
      if (!linkTitles[b.bookingLinkId]) {
        linkTitles[b.bookingLinkId] = b.bookingLinkId
      }
    }
  })
  // Fetch link titles
  const linkTitleMap = new Map<string, string>()
  for (const linkId of Object.keys(linkCounts)) {
    const linkSnap = await adminDb.collection('booking_links').doc(linkId).get()
    if (linkSnap.exists) {
      linkTitleMap.set(linkId, linkSnap.data()!.title)
    }
  }
  const topLinks = Object.entries(linkCounts)
    .map(([linkId, count]) => ({
      linkId,
      title: linkTitleMap.get(linkId) || 'Unknown',
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxLinkCount = Math.max(...topLinks.map(l => l.count), 1)

  // Day of week distribution
  const dayCounts: { [key: number]: number } = {}
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 0; i < 7; i++) {
    dayCounts[i] = 0
  }
  allBookings.forEach(b => {
    if (b.status === 'confirmed') {
      const day = parseISO(b.startTime).getDay()
      dayCounts[day]++
    }
  })
  const dayStats = dayNames.map((name, idx) => ({
    day: name,
    count: dayCounts[idx],
  }))
  const maxDayCount = Math.max(...dayStats.map(d => d.count), 1)

  return (
    <DashboardLayout
      user={{ email: user.email, name: host?.name }}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your booking activity</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Confirmed</p>
            <p className="text-3xl font-bold text-teal-600">{confirmed}</p>
            <p className="text-xs text-gray-500">{confirmedPct}%</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Cancelled</p>
            <p className="text-3xl font-bold text-red-600">{cancelled}</p>
            <p className="text-xs text-gray-500">{cancelledPct}%</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Rescheduled</p>
            <p className="text-3xl font-bold text-amber-600">{rescheduled}</p>
            <p className="text-xs text-gray-500">{rescheduledPct}%</p>
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Bookings by month (this year)</h2>
          <div className="space-y-2">
            {monthlyStats.map(stat => (
              <div key={stat.month} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 w-8">{stat.month}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                  {stat.count > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all"
                      style={{ width: `${(stat.count / maxMonthlyCount) * 100}%` }}
                    />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-900 w-8 text-right">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Status distribution</h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Confirmed</span>
                <span className="text-sm font-semibold text-gray-900">{confirmedPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500" style={{ width: `${confirmedPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Cancelled</span>
                <span className="text-sm font-semibold text-gray-900">{cancelledPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${cancelledPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Rescheduled</span>
                <span className="text-sm font-semibold text-gray-900">{rescheduledPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${rescheduledPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Peak Booking Times */}
        {peakHours.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Peak booking times</h2>
            <div className="space-y-2">
              {peakHours.map(stat => (
                <div key={stat.hour} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-8">{String(stat.hour).padStart(2, '0')}:00</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                    {stat.count > 0 && (
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                        style={{ width: `${(stat.count / maxHourCount) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-900 w-8 text-right">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Link Performance */}
        {topLinks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Booking link performance</h2>
            <div className="space-y-2">
              {topLinks.map((link, idx) => (
                <div key={link.linkId} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-6">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                        style={{ width: `${(link.count / maxLinkCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-gray-900">{link.count}</p>
                    <p className="text-xs text-gray-500">{link.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day of Week Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Bookings by day of week</h2>
          <div className="space-y-2">
            {dayStats.map(stat => (
              <div key={stat.day} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 w-8">{stat.day}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                  {stat.count > 0 && (
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                      style={{ width: `${(stat.count / maxDayCount) * 100}%` }}
                    />
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-900 w-8 text-right">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <AnalyticsExportButton bookings={allBookings.filter(b => b.status === 'confirmed')} />
      </div>
    </DashboardLayout>
  )
}
