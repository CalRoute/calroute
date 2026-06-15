import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

    const [bookingsSnap, hostsSnap] = await Promise.all([
      adminDb.collection('bookings').get(),
      adminDb.collection('hosts').get(),
    ])

    const confirmedBookings = bookingsSnap.docs
      .map(d => d.data())
      .filter(b => b.startTime >= thirtyDaysAgoStr && b.status === 'confirmed')

    const userIds = new Set(confirmedBookings.map(b => b.hostId))
    const userCount = userIds.size
    const totalBookings = confirmedBookings.length
    const totalUsers = hostsSnap.size
    const retentionRate = totalUsers > 0 ? ((userCount / totalUsers) * 100).toFixed(1) : '0'
    const bookingsPerUser = userCount > 0 ? (totalBookings / userCount).toFixed(2) : '0'

    return Response.json({ totalBookings, userCount, bookingsPerUser, totalUsers, retentionRate })
  } catch (error) {
    console.error('[admin] revenue stats error:', error)
    return Response.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
