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

  // Fetch all bookings for stats
  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('hostId', '==', user.uid)
    .get()

  const allBookings = bookingsSnap.docs
    .filter(d => d.data().status === 'confirmed')
    .map(d => ({ id: d.id, ...d.data() })) as any[]

  // Stats
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const thisMonthCount = allBookings.filter(b => {
    const d = parseISO(b.startTime)
    return d >= monthStart && d <= monthEnd
  }).length

  const upcomingCount = allBookings.filter(b => b.startTime >= now.toISOString()).length

  let teamSize = 0
  try {
    const linksSnap = await adminDb.collection('booking_links').where('ownerId', '==', user.uid).get()
    const teamMemberSet = new Set<string>()
    for (const linkDoc of linksSnap.docs) {
      const hostsSnap = await adminDb.collection('booking_links').doc(linkDoc.id).collection('hosts').get()
      hostsSnap.docs.forEach(h => {
        if (h.data().hostId !== user.uid) {
          teamMemberSet.add(h.data().hostId)
        }
      })
    }
    teamSize = teamMemberSet.size
  } catch (e) {
    console.error('[dashboard] failed to calculate team size:', e)
  }

  // Links I own — with team member count
  const linksSnap = await adminDb
    .collection('booking_links')
    .where('ownerId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const links = await Promise.all(
    linksSnap.docs.map(async (d) => {
      const hostsSnap = await adminDb
        .collection('booking_links').doc(d.id).collection('hosts').get()

      const members = await Promise.all(
        hostsSnap.docs.map(async (hDoc) => {
          const hData = hDoc.data()
          const profileSnap = await adminDb.collection('hosts').doc(hData.hostId).get()
          const profile = profileSnap.data()
          return {
            uid: hData.hostId,
            name: profile?.name ?? hData.hostId,
            avatarUrl: profile?.avatarUrl ?? null,
          }
        })
      )

      return { id: d.id, ...d.data(), members } as any
    })
  )

  // Links I'm a team member on (but don't own)
  let teamLinks: any[] = []
  try {
    const memberSnap = await adminDb
      .collectionGroup('hosts')
      .where('hostId', '==', user.uid)
      .get()

    teamLinks = (
      await Promise.all(
        memberSnap.docs.map(async (doc) => {
          const linkId = doc.ref.parent.parent?.id
          if (!linkId) return null
          const linkSnap = await adminDb.collection('booking_links').doc(linkId).get()
          if (!linkSnap.exists) return null
          const data = linkSnap.data()!
          if (data.ownerId === user.uid) return null
          const ownerSnap = await adminDb.collection('hosts').doc(data.ownerId).get()
          return {
            id: linkSnap.id,
            ...data,
            ownerName: ownerSnap.data()?.name ?? data.ownerId,
          }
        })
      )
    ).filter(Boolean) as any[]
  } catch (e) {
    console.error('[dashboard] collectionGroup query failed:', e)
  }

  function initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const upcomingBookings = allBookings
    .filter(b => b.startTime >= now.toISOString())
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 3)

  return (
    <DashboardLayout user={{ email: user.email, name: host?.name }} pageTitle="Dashboard">
      <div className="space-y-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase">This month</p>
              <div className="w-9 h-9 bg-[#0D7377]/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#0D7377]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{thisMonthCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase">Upcoming</p>
              <div className="w-9 h-9 bg-[#0D7377]/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#0D7377]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{upcomingCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase">Team size</p>
              <div className="w-9 h-9 bg-[#0D7377]/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#0D7377]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{teamSize}</p>
          </div>
        </div>

        {/* Upcoming Meetings Widget */}
        {upcomingBookings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Next bookings</h3>
            <div className="space-y-2">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0 text-sm font-medium text-gray-400 min-w-fit">
                    {format(parseISO(booking.startTime), 'MMM d, h:mm a')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{booking.customerName}</p>
                    <p className="text-xs text-gray-500 truncate">{booking.customerEmail}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/dashboard/bookings" className="text-xs text-[#0D7377] hover:underline font-medium">
              View all bookings →
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/links/new"
            className="flex-1 bg-[#0D7377] text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-[#0a5f63] transition-colors text-center"
          >
            + New link
          </Link>
          <Link
            href="/dashboard/bookings"
            className="flex-1 bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors text-center"
          >
            View bookings
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex-1 bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Settings
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Manage your booking links</h2>
          <Link
            href="/dashboard/links/new"
            className="bg-[#0D7377] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-[#0a5f63] transition-colors whitespace-nowrap"
          >
            + New link
          </Link>
        </div>

        {/* My links */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My booking links</h3>
          {links.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 sm:p-12 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-500 mb-4 text-sm">No booking links yet.</p>
              <Link
                href="/dashboard/links/new"
                className="inline-flex items-center gap-1 bg-[#0D7377] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0a5f63] transition-colors"
              >
                Create your first link →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{link.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {link.durationMinutes} min · {link.routingStrategy === 'round_robin' ? 'Round robin' : 'Priority'} routing
                      </p>
                      <a
                        href={`${process.env.NEXT_PUBLIC_APP_URL}/book/${link.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0D7377] hover:underline mt-1 block truncate"
                      >
                        /book/{link.slug}
                      </a>

                      {/* Team member avatars */}
                      {link.members.length > 0 && (
                        <div className="flex items-center gap-2 mt-2.5">
                          <div className="flex -space-x-1.5">
                            {link.members.slice(0, 5).map((m: any) => (
                              <div
                                key={m.uid}
                                title={m.name}
                                className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-semibold overflow-hidden flex-shrink-0"
                              >
                                {m.avatarUrl
                                  ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                                  : initials(m.name)}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {link.members.length === 1
                              ? '1 host'
                              : `${link.members.length} hosts`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/dashboard/links/${link.id}`}
                        className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Team links — links I'm a host on but don't own */}
        {teamLinks.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Team links I host</h3>
            <div className="space-y-3">
              {teamLinks.map((link) => (
                <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{link.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {link.durationMinutes} min · managed by {link.ownerName}
                      </p>
                      <a
                        href={`${process.env.NEXT_PUBLIC_APP_URL}/book/${link.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0D7377] hover:underline mt-1 block truncate"
                      >
                        /book/{link.slug}
                      </a>
                    </div>
                    <span className="text-xs text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                      Host
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Set your availability in{' '}
              <Link href="/dashboard/settings" className="underline hover:text-gray-600">Settings</Link>{' '}
              so bookings route to you correctly.
            </p>
          </section>
        )}

        {/* Sign out on mobile */}
        <div className="sm:hidden text-center">
          <Link href="/api/auth/signout" className="text-sm text-gray-400 hover:text-gray-600">
            Sign out
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
