export const dynamic = 'force-dynamic'

import { requireAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'
import { format, parseISO, subDays } from 'date-fns'

export default async function AdminDashboardPage() {
  await requireAdminSession()

  const [hostsSnap, bookingsSnap, linksSnap] = await Promise.all([
    adminDb.collection('hosts').get(),
    adminDb.collection('bookings').get(),
    adminDb.collection('booking_links').get(),
  ])

  const totalUsers = hostsSnap.size
  const totalBookings = bookingsSnap.size
  const confirmed = bookingsSnap.docs.filter(d => d.data().status === 'confirmed').length
  const cancelled = bookingsSnap.docs.filter(d => d.data().status === 'cancelled').length
  const totalLinks = linksSnap.size

  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
  const activeUsers = new Set(
    bookingsSnap.docs
      .filter(d => d.data().startTime >= thirtyDaysAgo)
      .map(d => d.data().hostId)
  ).size

  const recentBookings = bookingsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((b: any) => b.status === 'confirmed')
    .sort((a: any, b: any) => b.startTime?.localeCompare(a.startTime ?? '') ?? 0)
    .slice(0, 10) as any[]

  const stats = [
    { label: 'Total users', value: totalUsers, sub: `${activeUsers} active (30d)` },
    { label: 'Total bookings', value: totalBookings, sub: `${confirmed} confirmed` },
    { label: 'Cancelled', value: cancelled, sub: `${totalBookings > 0 ? Math.round((cancelled / totalBookings) * 100) : 0}% rate` },
    { label: 'Booking links', value: totalLinks, sub: 'across all users' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">System metrics across all CalRoute users</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent bookings</h2>
        </div>
        {recentBookings.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No bookings yet</p>
        ) : (
          <div className="divide-y divide-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left hidden sm:table-cell">Host</th>
                  <th className="px-6 py-3 text-left">Time</th>
                  <th className="px-6 py-3 text-left hidden md:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[160px]">{b.customerName}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{b.customerEmail}</p>
                    </td>
                    <td className="px-6 py-3 hidden sm:table-cell text-gray-600 truncate max-w-[140px]">{b.hostId}</td>
                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                      {b.startTime ? format(parseISO(b.startTime), 'MMM d, h:mm a') : '—'}
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        b.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm font-semibold text-amber-900 mb-1">Full admin panel</p>
        <p className="text-sm text-amber-700">
          Advanced tools (user management, email monitoring, analytics, branding) are available at{' '}
          <a href="https://calroute.me/dashboard/admin" className="underline font-medium">calroute.me/dashboard/admin</a>{' '}
          while Phase 2 migration is in progress.
        </p>
      </div>
    </div>
  )
}
