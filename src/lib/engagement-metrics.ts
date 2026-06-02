import { adminDb } from './firebase/admin'

export async function getUserEngagementMetrics(days = 30) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const sinceStr = since.toISOString()

    // Get all hosts
    const hostsSnap = await adminDb.collection('hosts').get()
    const hosts = hostsSnap.docs.map(d => ({ uid: d.id, ...(d.data() as any) }))

    // Get bookings for each host
    const allBookingsSnap = await adminDb.collection('bookings').get()
    const recentBookings = allBookingsSnap.docs
      .map(d => d.data())
      .filter(b => b.createdAt >= sinceStr)

    // Calculate metrics per host
    const metrics = hosts.map(host => {
      const hostBookings = recentBookings.filter(b => b.hostId === host.uid)
      const cancelledBookings = hostBookings.filter(b => b.status === 'cancelled').length
      const confirmedBookings = hostBookings.filter(b => b.status === 'confirmed').length

      return {
        uid: host.uid,
        email: host.email,
        name: host.name,
        totalBookings: hostBookings.length,
        confirmedBookings,
        cancelledBookings,
        cancellationRate:
          hostBookings.length > 0 ? ((cancelledBookings / hostBookings.length) * 100).toFixed(1) : '0',
        engagementScore:
          hostBookings.length > 0 ? Math.round((confirmedBookings / hostBookings.length) * 100) : 0,
      }
    })

    return metrics.sort((a, b) => b.totalBookings - a.totalBookings)
  } catch (error) {
    console.error('[engagement] error:', error)
    return []
  }
}

export async function getCalendarSyncStatus() {
  try {
    const hostsSnap = await adminDb.collection('hosts').get()

    const syncStatus = await Promise.all(
      hostsSnap.docs.map(async (hostDoc) => {
        const calendarsSnap = await hostDoc.ref.collection('calendars').get()
        const calendars = calendarsSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }))

        const lastSyncTimes = calendars.map(c => new Date(c.lastSyncedAt || 0).getTime())
        const mostRecentSync = lastSyncTimes.length > 0 ? Math.max(...lastSyncTimes) : 0
        const minutesSinceSync = Math.round((Date.now() - mostRecentSync) / 60000)

        return {
          hostId: hostDoc.id,
          email: hostDoc.data().email,
          totalCalendars: calendars.length,
          syncedCalendars: calendars.filter(c => c.lastSyncedAt).length,
          lastSyncMinutesAgo: minutesSinceSync,
          syncStatus: minutesSinceSync < 60 ? 'synced' : minutesSinceSync < 1440 ? 'stale' : 'outdated',
        }
      })
    )

    return syncStatus
  } catch (error) {
    console.error('[sync] error:', error)
    return []
  }
}

export async function getBookingRescheduleAnalytics() {
  try {
    const bookingsSnap = await adminDb.collection('bookings').get()
    const bookings = bookingsSnap.docs.map(d => d.data())

    const rescheduleAttempts = bookings.filter(b => b.originalStartTime).length
    const totalBookings = bookings.length

    // Group by reason
    const reasons: Record<string, number> = {}
    bookings.forEach(b => {
      if (b.rescheduleReason) {
        reasons[b.rescheduleReason] = (reasons[b.rescheduleReason] || 0) + 1
      }
    })

    // Calculate by time of day
    const reschedulesByHour: Record<number, number> = {}
    bookings.forEach(b => {
      if (b.rescheduledAt) {
        const hour = new Date(b.rescheduledAt).getHours()
        reschedulesByHour[hour] = (reschedulesByHour[hour] || 0) + 1
      }
    })

    return {
      totalReschedules: rescheduleAttempts,
      rescheduleRate:
        totalBookings > 0 ? ((rescheduleAttempts / totalBookings) * 100).toFixed(1) : '0',
      reasonBreakdown: reasons,
      peakRescheduleHour: Object.entries(reschedulesByHour).sort((a, b) => b[1] - a[1])[0]?.[0] || 0,
    }
  } catch (error) {
    console.error('[reschedule] error:', error)
    return null
  }
}
