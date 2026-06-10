export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import Link from 'next/link'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import DashboardLayout from '@/components/DashboardLayout'

export default async function DashboardPage() {
  const user = await requireUser('/dashboard')

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('hostId', '==', user.uid)
    .get()

  const allBookings = bookingsSnap.docs
    .filter(d => d.data().status === 'confirmed')
    .map(d => ({ id: d.id, ...d.data() })) as any[]

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const thisMonthCount = allBookings.filter(b => {
    const d = parseISO(b.startTime)
    return d >= monthStart && d <= monthEnd
  }).length

  const upcomingBookings = allBookings
    .filter(b => b.startTime >= now.toISOString())
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5)

  const upcomingCount = upcomingBookings.length

  const linksSnap = await adminDb
    .collection('booking_links')
    .where('ownerId', '==', user.uid)
    .get()

  const linkCount = linksSnap.size
  const activeCount = linksSnap.docs.filter(d => d.data().isActive).length

  return (
    <DashboardLayout user={{ email: user.email, name: host?.name }} pageTitle="Dashboard">
      <div className="space-y-6">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {host?.name ? `Hey, ${host.name.split(' ')[0]} 👋` : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening with your bookings.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">This month</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{thisMonthCount}</p>
            <p className="text-xs text-gray-400 mt-1">bookings</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Upcoming</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{upcomingCount}</p>
            <p className="text-xs text-gray-400 mt-1">confirmed</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Links</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{linkCount}</p>
            <p className="text-xs text-gray-400 mt-1">{activeCount} active</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">All time</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{allBookings.length}</p>
            <p className="text-xs text-gray-400 mt-1">bookings</p>
          </div>
        </div>

        {/* Next bookings */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Upcoming bookings</h2>
            <Link href="/dashboard/bookings" className="text-xs text-[#0D7377] hover:underline font-medium">
              View all →
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-500">No upcoming bookings.</p>
              <Link href="/dashboard/links" className="text-sm text-[#0D7377] hover:underline mt-2 inline-block">
                Share a booking link to get started →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-shrink-0 w-14 text-center">
                    <p className="text-xs font-semibold text-[#0D7377] uppercase">
                      {format(parseISO(booking.startTime), 'MMM')}
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-none">
                      {format(parseISO(booking.startTime), 'd')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{booking.customerName}</p>
                    <p className="text-xs text-gray-500 truncate">{booking.customerEmail}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-gray-700 font-medium">
                      {format(parseISO(booking.startTime), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/links/new"
            className="flex items-center gap-3 bg-[#0D7377] text-white px-5 py-4 rounded-2xl hover:bg-[#0a5f63] transition-colors group"
          >
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">New booking link</p>
              <p className="text-xs text-white/70">Create and share</p>
            </div>
          </Link>
          <Link
            href="/dashboard/links"
            className="flex items-center gap-3 bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Manage links</p>
              <p className="text-xs text-gray-500">{linkCount} link{linkCount !== 1 ? 's' : ''}</p>
            </div>
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 bg-white border border-gray-200 text-gray-900 px-5 py-4 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Settings</p>
              <p className="text-xs text-gray-500">Availability, profile</p>
            </div>
          </Link>
        </div>

      </div>
    </DashboardLayout>
  )
}
