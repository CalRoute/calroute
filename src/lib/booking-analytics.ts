import { adminDb } from './firebase/admin'

export async function getBookingDurationStats() {
  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .get()

  const bookings = bookingsSnap.docs.map(d => {
    const data = d.data()
    const start = new Date(data.startTime).getTime()
    const end = new Date(data.endTime).getTime()
    const durationMs = end - start
    const durationMins = Math.round(durationMs / (1000 * 60))
    return { durationMins, ...data }
  })

  if (bookings.length === 0) {
    return {
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      totalBookings: 0,
    }
  }

  const durations = bookings.map(b => b.durationMins)
  const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
  const minDuration = Math.min(...durations)
  const maxDuration = Math.max(...durations)

  return {
    avgDuration,
    minDuration,
    maxDuration,
    totalBookings: bookings.length,
  }
}

export async function getMostPopularLinks(limit = 10) {
  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .get()

  const linkCounts = {} as Record<string, { count: number; title: string }>

  await Promise.all(
    bookingsSnap.docs.map(async (doc) => {
      const data = doc.data()
      const linkId = data.bookingLinkId

      if (!linkCounts[linkId]) {
        const linkSnap = await adminDb.collection('booking_links').doc(linkId).get()
        const linkData = linkSnap.data()
        linkCounts[linkId] = {
          count: 0,
          title: linkData?.title || 'Unknown',
        }
      }

      linkCounts[linkId].count += 1
    })
  )

  return Object.entries(linkCounts)
    .map(([id, data]) => ({
      linkId: id,
      title: data.title,
      bookingCount: data.count,
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, limit)
}

export async function getGeographicDistribution() {
  // Simple country distribution based on timezone guessing
  // In production, you'd track customer location explicitly
  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .get()

  const timezones = new Map<string, number>()

  for (const doc of bookingsSnap.docs) {
    const data = doc.data()
    const linkSnap = await adminDb.collection('booking_links').doc(data.bookingLinkId).get()
    const linkData = linkSnap.data()
    const timezone = linkData?.timezone || 'UTC'
    timezones.set(timezone, (timezones.get(timezone) || 0) + 1)
  }

  return Array.from(timezones.entries())
    .map(([timezone, count]) => ({ timezone, bookingCount: count }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
}

export async function getBookingTrends(days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .where('startTime', '>=', startDate.toISOString())
    .get()

  const bookings = bookingsSnap.docs.map(d => d.data())

  // Group by date
  const dailyData = {} as Record<string, number>

  bookings.forEach(booking => {
    const date = new Date(booking.startTime).toISOString().split('T')[0]
    dailyData[date] = (dailyData[date] || 0) + 1
  })

  return Object.entries(dailyData)
    .map(([date, count]) => ({ date, bookingCount: count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
