import { adminDb } from './firebase/admin'

export interface RevenueData {
  date: string
  bookingsCount: number
  estimatedValue: number
  planType: string
}

export async function trackBookingRevenue(bookingId: string, amount: number = 0) {
  try {
    await adminDb.collection('revenue_tracking').add({
      bookingId,
      amount,
      date: new Date().toISOString(),
      type: 'booking',
    })
  } catch (error) {
    console.error('[revenue] error tracking:', error)
  }
}

export async function getRevenueAnalytics(days = 30) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get all bookings
    const bookingsSnap = await adminDb.collection('bookings').get()
    const allBookings = bookingsSnap.docs.map(d => d.data())

    // Filter bookings from the date range
    const recentBookings = allBookings.filter(b => new Date(b.createdAt) >= since)

    // Calculate daily revenue (estimated - assuming standard booking value)
    const dailyRevenue: Record<string, RevenueData> = {}

    recentBookings.forEach(booking => {
      const date = new Date(booking.createdAt).toISOString().split('T')[0]
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = {
          date,
          bookingsCount: 0,
          estimatedValue: 0,
          planType: 'standard',
        }
      }
      dailyRevenue[date].bookingsCount++
      // Assuming $50 per booking for standard plan
      dailyRevenue[date].estimatedValue += 50
    })

    // Get all users to calculate plan types
    const hostsSnap = await adminDb.collection('hosts').get()
    const hosts = hostsSnap.docs.map(d => d.data() as any)

    // Calculate totals
    const totalBookings = recentBookings.length
    const totalEstimatedValue = totalBookings * 50
    const averagePerDay = (totalBookings / days).toFixed(1)

    // Calculate MRR (Monthly Recurring Revenue) - simplified
    const mrr = hosts.length * 25 // Assuming $25 base fee per user

    return {
      period: `${days} days`,
      totalBookings,
      totalEstimatedValue,
      averagePerDay,
      monthlyRecurringRevenue: mrr,
      dailyBreakdown: Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date)),
      userCount: hosts.length,
      bookingsPerUser: (totalBookings / hosts.length).toFixed(2),
    }
  } catch (error) {
    console.error('[revenue] error getting analytics:', error)
    return null
  }
}

export async function getRevenueProjection(currentUsers: number, bookingRate: number) {
  // Simple projection: assume growth rate
  const projections = []
  for (let month = 1; month <= 12; month++) {
    const projectedUsers = Math.round(currentUsers * Math.pow(1.1, month))
    const projectedMRR = projectedUsers * 25
    const projectedBookings = Math.round(projectedUsers * bookingRate * month)

    projections.push({
      month,
      projectedUsers,
      projectedMRR,
      projectedBookings,
      projectedARR: projectedMRR * 12,
    })
  }
  return projections
}
