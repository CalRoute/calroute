import { requireAdminApi } from '@/lib/admin-session'
import { adminDb } from '@/lib/firebase/admin'


export async function GET(request: Request) {
  const adminCheck = await requireAdminApi(request)
  if (adminCheck instanceof Response) return adminCheck
  const user = adminCheck

  try {
    // Get bookings from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

    const bookingsSnap = await adminDb.collection('bookings').get()
    const allBookings = bookingsSnap.docs.map(d => d.data())

    // Filter bookings from last 30 days
    const recentBookings = allBookings.filter(b => b.startTime >= thirtyDaysAgoStr)
    const confirmedBookings = recentBookings.filter(b => b.status === 'confirmed')

    // Get unique users with bookings
    const userIds = new Set(confirmedBookings.map(b => b.hostId))

    // Calculate metrics
    const totalBookings = confirmedBookings.length
    const AVERAGE_BOOKING_VALUE = 50 // Default booking value in USD
    const totalEstimatedValue = totalBookings * AVERAGE_BOOKING_VALUE

    // Calculate average per day
    const days = 30
    const averagePerDay = (totalEstimatedValue / days).toFixed(2)

    // Calculate monthly recurring revenue (MRR)
    // Assuming users stay for a month, MRR = total estimated value for this period
    const monthlyRecurringRevenue = totalEstimatedValue

    // Active users (unique users with confirmed bookings in last 30 days)
    const userCount = userIds.size

    // Average bookings per user
    const bookingsPerUser = userCount > 0 ? (totalBookings / userCount).toFixed(2) : '0'

    // Calculate total users to show retention
    const hostsSnap = await adminDb.collection('hosts').get()
    const totalUsers = hostsSnap.size

    // Retention rate (users with bookings / total users)
    const retentionRate = totalUsers > 0 ? ((userCount / totalUsers) * 100).toFixed(1) : '0'

    return Response.json({
      totalBookings,
      totalEstimatedValue,
      averagePerDay,
      monthlyRecurringRevenue,
      userCount,
      bookingsPerUser,
      totalUsers,
      retentionRate,
      averageBookingValue: AVERAGE_BOOKING_VALUE,
    })
  } catch (error) {
    console.error('[admin] revenue stats error:', error)
    return Response.json({ error: 'Failed to load revenue stats' }, { status: 500 })
  }
}
