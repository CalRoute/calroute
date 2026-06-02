import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function POST(request: Request) {
  const user = await requireUser('/dashboard')

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { uid: input } = await request.json() as { uid: string }

  if (!input) {
    return Response.json({ error: 'UID or email required' }, { status: 400 })
  }

  try {
    let uid = input

    // If input looks like an email, try to find the user by email
    if (input.includes('@')) {
      const hostsSnap = await adminDb
        .collection('hosts')
        .where('email', '==', input)
        .limit(1)
        .get()

      if (hostsSnap.empty) {
        return Response.json({ error: 'User not found' }, { status: 404 })
      }

      uid = hostsSnap.docs[0].id
    }

    // Get host details
    const hostSnap = await adminDb.collection('hosts').doc(uid).get()
    if (!hostSnap.exists) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const hostData = hostSnap.data()!

    // Get links
    const linksSnap = await adminDb
      .collection('booking_links')
      .where('ownerId', '==', uid)
      .get()

    const links = await Promise.all(
      linksSnap.docs.map(async (linkDoc) => {
        const linkData = linkDoc.data()
        const hostsSnap = await adminDb
          .collection('booking_links')
          .doc(linkDoc.id)
          .collection('hosts')
          .get()
        const bookingsSnap = await adminDb
          .collection('bookings')
          .where('bookingLinkId', '==', linkDoc.id)
          .get()

        return {
          id: linkDoc.id,
          title: linkData.title,
          slug: linkData.slug,
          durationMinutes: linkData.durationMinutes,
          memberCount: hostsSnap.size,
          bookingCount: bookingsSnap.size,
          isActive: linkData.isActive,
        }
      })
    )

    // Get calendars
    const calsSnap = await adminDb
      .collection('hosts')
      .doc(uid)
      .collection('connected_calendars')
      .get()

    const calendars = calsSnap.docs.map((doc) => ({
      id: doc.id,
      accountEmail: doc.data().accountEmail,
      calendarId: doc.data().calendarId,
      isActive: doc.data().isActive,
    }))

    // Get recent bookings
    const bookingsSnap = await adminDb
      .collection('bookings')
      .where('hostId', '==', uid)
      .orderBy('startTime', 'desc')
      .limit(20)
      .get()

    const recentBookings = await Promise.all(
      bookingsSnap.docs.map(async (doc) => {
        const data = doc.data()
        const linkSnap = await adminDb.collection('booking_links').doc(data.bookingLinkId).get()
        return {
          id: doc.id,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          startTime: data.startTime,
          status: data.status,
          linkTitle: linkSnap.data()?.title || 'Deleted link',
        }
      })
    )

    return Response.json({
      user: {
        uid,
        email: hostData.email,
        name: hostData.name,
        timezone: hostData.timezone,
        createdAt: hostData.createdAt,
        links,
        calendars,
        recentBookings,
      },
    })
  } catch (error) {
    console.error('[admin] debug error:', error)
    return Response.json({ error: 'Debug failed' }, { status: 500 })
  }
}
