export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import DashboardLayout from '@/components/DashboardLayout'
import BookingsClient from './BookingsClient'

export default async function BookingsPage() {
  const user = await requireUser('/dashboard/bookings')

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

  const snap = await adminDb
    .collection('bookings')
    .where('hostId', '==', user.uid)
    .get()

  const allBookings = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data()
      const linkSnap = await adminDb.collection('booking_links').doc(data.bookingLinkId).get()
      const link = linkSnap.data()

      // Load other team members on this link (for transfer)
      const hostsSnap = await adminDb
        .collection('booking_links').doc(data.bookingLinkId)
        .collection('hosts').get()

      const teamMembers = await Promise.all(
        hostsSnap.docs
          .filter(h => h.data().hostId !== user.uid)
          .map(async h => {
            const profileSnap = await adminDb.collection('hosts').doc(h.data().hostId).get()
            const profile = profileSnap.data()
            return { uid: h.data().hostId, name: profile?.name ?? h.data().hostId }
          })
      )

      return {
        id: d.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerNotes: data.customerNotes ?? null,
        startTime: data.startTime,
        status: data.status,
        linkTitle: link?.title ?? 'Deleted link',
        linkSlug: link?.slug ?? '',
        durationMinutes: link?.durationMinutes ?? 30,
        teamMembers,
      }
    })
  )

  const now = new Date().toISOString()
  const upcoming = allBookings
    .filter(b => b.status === 'confirmed' && b.startTime >= now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const past = allBookings
    .filter(b => b.status === 'confirmed' && b.startTime < now)
    .sort((a, b) => b.startTime.localeCompare(a.startTime))

  const cancelled = allBookings
    .filter(b => b.status === 'cancelled')
    .sort((a, b) => b.startTime.localeCompare(a.startTime))

  const rescheduled = allBookings
    .filter(b => b.status === 'rescheduled')
    .sort((a, b) => b.startTime.localeCompare(a.startTime))

  const linkTitles = [...new Set(allBookings.map(b => b.linkTitle))]

  // Deduplicated team members for filter
  const teamMembersForFilter: { uid: string; name: string }[] = []
  const memberMap = new Map<string, string>()
  allBookings.forEach(b => {
    b.teamMembers.forEach(m => {
      if (!memberMap.has(m.uid)) {
        memberMap.set(m.uid, m.name)
      }
    })
  })
  memberMap.forEach((name, uid) => {
    teamMembersForFilter.push({ uid, name })
  })

  // Metrics
  const metrics = {
    total: allBookings.length,
    confirmed: upcoming.length + past.length,
    cancelled: cancelled.length,
    rescheduled: rescheduled.length,
  }

  return (
    <DashboardLayout
      user={{ email: user.email, name: host?.name }}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bookings' }]}
    >
      <BookingsClient
        upcoming={upcoming}
        past={past}
        cancelled={cancelled}
        rescheduled={rescheduled}
        linkTitles={linkTitles}
        teamMembersForFilter={teamMembersForFilter}
        metrics={metrics}
      />
    </DashboardLayout>
  )
}
