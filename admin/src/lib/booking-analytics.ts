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

export async function getGuestTimezoneDistribution() {
  // Uses the guest's own timezone submitted at booking time (from their browser),
  // not the host's configured timezone.
  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .get()

  const timezones = new Map<string, number>()

  for (const doc of bookingsSnap.docs) {
    const tz = doc.data().timezone || 'UTC'
    timezones.set(tz, (timezones.get(tz) || 0) + 1)
  }

  return Array.from(timezones.entries())
    .map(([timezone, count]) => ({ timezone, bookingCount: count }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
}

export async function getBookingTrends(days = 7) {
  // Build a dense 7-day window (today − 6 days → today) so every day
  // appears even if there were zero bookings that day.
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dailyData: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dailyData[d.toISOString().split('T')[0]] = 0
  }

  const startDateStr = Object.keys(dailyData)[0]

  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .get()

  bookingsSnap.docs
    .map(d => d.data())
    .filter(b => b.startTime >= startDateStr)
    .forEach(b => {
      const date = new Date(b.startTime).toISOString().split('T')[0]
      if (date in dailyData) dailyData[date]++
    })

  return Object.entries(dailyData)
    .map(([date, bookingCount]) => ({ date, bookingCount }))
}
