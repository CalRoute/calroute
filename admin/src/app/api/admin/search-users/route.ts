import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'


export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const user = { uid: session.uid, email: session.email }

  const { query } = await request.json() as { query: string }

  if (!query || query.length < 2) {
    return Response.json({ error: 'Query too short' }, { status: 400 })
  }

  try {
    const lowerQuery = query.toLowerCase()

    // Search by email (case-insensitive)
    const emailSnap = await adminDb
      .collection('hosts')
      .where('email', '>=', lowerQuery)
      .where('email', '<=', lowerQuery + '')
      .limit(10)
      .get()

    const results = await Promise.all(
      emailSnap.docs.map(async (doc) => {
        const data = doc.data()
        const uid = doc.id

        // Get booking count
        const bookingsSnap = await adminDb
          .collection('bookings')
          .where('hostId', '==', uid)
          .get()

        // Get link count
        const linksSnap = await adminDb
          .collection('booking_links')
          .where('ownerId', '==', uid)
          .get()

        // Check if has calendar
        const calSnap = await adminDb
          .collection('hosts')
          .doc(uid)
          .collection('connected_calendars')
          .limit(1)
          .get()

        return {
          uid,
          email: data.email,
          name: data.name || 'Unknown',
          timezone: data.timezone || 'UTC',
          createdAt: data.createdAt || new Date().toISOString(),
          bookingCount: bookingsSnap.size,
          linkCount: linksSnap.size,
          hasCalendar: !calSnap.empty,
        }
      })
    )

    // Also search by name if no email matches
    let nameResults: any[] = []
    if (results.length < 5) {
      const allHostsSnap = await adminDb.collection('hosts').get()
      nameResults = allHostsSnap.docs
        .filter((doc) => {
          const name = (doc.data().name || '').toLowerCase()
          return name.includes(lowerQuery)
        })
        .slice(0, 10 - results.length)
        .map((doc) => ({
          uid: doc.id,
          email: doc.data().email,
          name: doc.data().name || 'Unknown',
          timezone: doc.data().timezone || 'UTC',
          createdAt: doc.data().createdAt || new Date().toISOString(),
          bookingCount: 0,
          linkCount: 0,
          hasCalendar: false,
        }))

      // For name results, get the actual counts
      const enrichedNameResults = await Promise.all(
        nameResults.map(async (user) => {
          const bookingsSnap = await adminDb
            .collection('bookings')
            .where('hostId', '==', user.uid)
            .get()

          const linksSnap = await adminDb
            .collection('booking_links')
            .where('ownerId', '==', user.uid)
            .get()

          const calSnap = await adminDb
            .collection('hosts')
            .doc(user.uid)
            .collection('connected_calendars')
            .limit(1)
            .get()

          return {
            ...user,
            bookingCount: bookingsSnap.size,
            linkCount: linksSnap.size,
            hasCalendar: !calSnap.empty,
          }
        })
      )

      nameResults = enrichedNameResults
    }

    return Response.json({ users: [...results, ...nameResults] })
  } catch (error) {
    console.error('[admin] search error:', error)
    return Response.json({ error: 'Search failed' }, { status: 500 })
  }
}
