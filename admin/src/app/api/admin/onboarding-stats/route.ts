import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const hostsSnap = await adminDb.collection('hosts').get()
    const totalUsers = hostsSnap.size

    if (totalUsers === 0) {
      return Response.json({ totalUsers: 0, calendarConnectedRate: '0', bookingLinkCreatedRate: '0', firstBookingRate: '0' })
    }

    let calendarConnectedCount = 0
    let bookingLinkCreatedCount = 0
    let firstBookingCount = 0
    const completionTimes: number[] = []

    await Promise.all(
      hostsSnap.docs.map(async (hostDoc) => {
        const hostId = hostDoc.id
        const hostData = hostDoc.data()

        const [calendarsSnap, linksSnap, bookingsSnap] = await Promise.all([
          adminDb.collection('hosts').doc(hostId).collection('connected_calendars').get(),
          adminDb.collection('booking_links').where('ownerId', '==', hostId).limit(1).get(),
          adminDb.collection('bookings').where('hostId', '==', hostId).where('status', '==', 'confirmed').limit(1).get(),
        ])

        if (calendarsSnap.size > 0) calendarConnectedCount++
        if (linksSnap.size > 0) bookingLinkCreatedCount++
        if (bookingsSnap.size > 0) {
          firstBookingCount++
          const createdAt = hostData.createdAt ? new Date(hostData.createdAt).getTime() : 0
          const firstBookingTime = new Date(bookingsSnap.docs[0].data().startTime).getTime()
          if (createdAt > 0 && firstBookingTime > createdAt) {
            completionTimes.push(firstBookingTime - createdAt)
          }
        }
      })
    )

    let avgTimeToFirstBooking = '—'
    if (completionTimes.length > 0) {
      const avgMs = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      const days = Math.floor(avgMs / 86400000)
      const hours = Math.floor((avgMs / 3600000) % 24)
      avgTimeToFirstBooking = days > 0 ? `${days}d ${hours}h` : `${hours}h`
    }

    return Response.json({
      totalUsers,
      calendarConnectedCount,
      bookingLinkCreatedCount,
      firstBookingCount,
      calendarConnectedRate: ((calendarConnectedCount / totalUsers) * 100).toFixed(0),
      bookingLinkCreatedRate: ((bookingLinkCreatedCount / totalUsers) * 100).toFixed(0),
      firstBookingRate: ((firstBookingCount / totalUsers) * 100).toFixed(0),
      avgTimeToFirstBooking,
    })
  } catch (error) {
    console.error('[admin] onboarding stats error:', error)
    return Response.json({ error: 'Failed to load onboarding stats' }, { status: 500 })
  }
}
