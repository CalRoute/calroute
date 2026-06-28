import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const now = Date.now()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString()

    const bookingsSnap = await adminDb.collection('bookings').get()
    const allBookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))

    const confirmed = allBookings.filter(b => b.status === 'confirmed')
    const cancelled = allBookings.filter(b => b.status === 'cancelled')

    // ── 1. Booking conversion rate ─────────────────────────────
    // Proxy: cancellation rate (we don't have slot view events)
    const totalFinished = confirmed.length + cancelled.length
    const cancellationRate = totalFinished > 0
      ? Math.round((cancelled.length / totalFinished) * 100)
      : 0

    // ── 2. Late cancellations (within 24h of start time) ──────
    const lateCancels = cancelled.filter(b => {
      if (!b.startTime || !b.cancelledAt && !b.updatedAt) return false
      const cancelledAt = new Date(b.cancelledAt || b.updatedAt).getTime()
      const startTime = new Date(b.startTime).getTime()
      return (startTime - cancelledAt) < 24 * 60 * 60 * 1000
    })
    const lateCancelRate = cancelled.length > 0
      ? Math.round((lateCancels.length / cancelled.length) * 100)
      : 0

    // ── 3. Peak booking hours ──────────────────────────────────
    const hourCounts: Record<number, number> = {}
    confirmed.forEach(b => {
      if (!b.createdAt) return
      const hour = new Date(b.createdAt).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))

    // ── 4. Churned users (active 30-60d ago, silent last 30d) ─
    const activeInPrev = new Set(
      allBookings
        .filter(b => b.createdAt >= sixtyDaysAgo && b.createdAt < thirtyDaysAgo)
        .map(b => b.hostId)
    )
    const activeInRecent = new Set(
      allBookings
        .filter(b => b.createdAt >= thirtyDaysAgo)
        .map(b => b.hostId)
    )
    const churnedHostIds = [...activeInPrev].filter(id => !activeInRecent.has(id))

    // Fetch churned user emails
    const churnedUsers = await Promise.all(
      churnedHostIds.slice(0, 10).map(async uid => {
        const snap = await adminDb.collection('hosts').doc(uid).get()
        return snap.exists ? { uid, email: snap.data()!.email, name: snap.data()!.name } : null
      })
    ).then(results => results.filter(Boolean))

    // ── 5. Dead links (no bookings in 30d, link is active) ────
    const linksSnap = await adminDb.collection('booking_links').where('isActive', '==', true).get()
    const recentHostIds = new Set(
      confirmed.filter(b => b.createdAt >= thirtyDaysAgo).map(b => b.bookingLinkId)
    )
    const deadLinks = linksSnap.docs
      .filter(d => !recentHostIds.has(d.id))
      .map(d => ({ id: d.id, title: d.data().title, slug: d.data().slug }))
      .slice(0, 10)

    return Response.json({
      cancellationRate,
      totalConfirmed: confirmed.length,
      totalCancelled: cancelled.length,
      lateCancelRate,
      lateCancelCount: lateCancels.length,
      peakHours,
      churnedUsers,
      churnedCount: churnedHostIds.length,
      deadLinks,
      deadLinkCount: deadLinks.length,
      totalActiveLinks: linksSnap.size,
    })
  } catch (error) {
    console.error('[booking-insights] error:', error)
    return Response.json({ error: 'Failed to load insights' }, { status: 500 })
  }
}
