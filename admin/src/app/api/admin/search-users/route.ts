import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { query } = await request.json() as { query: string }
  if (!query || query.length < 2) return Response.json({ error: 'Query too short' }, { status: 400 })

  try {
    const lowerQuery = query.toLowerCase()

    // Fetch all hosts and filter in-memory — avoids index requirements and handles case-insensitive matching
    const allHostsSnap = await adminDb.collection('hosts').get()
    const matching = allHostsSnap.docs.filter(doc => {
      const data = doc.data()
      return (
        (data.email || '').toLowerCase().includes(lowerQuery) ||
        (data.name || '').toLowerCase().includes(lowerQuery)
      )
    }).slice(0, 10)

    const results = await Promise.all(
      matching.map(async (doc) => {
        const data = doc.data()
        const uid = doc.id

        const [bookingsSnap, linksSnap, calSnap] = await Promise.all([
          adminDb.collection('bookings').where('hostId', '==', uid).get(),
          adminDb.collection('booking_links').where('ownerId', '==', uid).get(),
          adminDb.collection('hosts').doc(uid).collection('connected_calendars').limit(1).get(),
        ])

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

    return Response.json({ users: results })
  } catch (error) {
    console.error('[admin] search error:', error)
    return Response.json({ error: 'Search failed' }, { status: 500 })
  }
}
