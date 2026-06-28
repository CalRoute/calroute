import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const now = Date.now()
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000)

    // ── Webhooks ────────────────────────────────────────────────
    const [webhooksSnap, errorLogsSnap] = await Promise.all([
      adminDb.collectionGroup('webhooks').get(),
      adminDb.collection('error_logs').get(),
    ])
    const totalWebhooks = webhooksSnap.size
    const failedWebhooks = errorLogsSnap.docs
      .map(d => d.data())
      .filter(l => l.errorType === 'webhook_delivery' && new Date(l.timestamp) >= twentyFourHoursAgo)
      .length
    const failureRate = totalWebhooks > 0 ? ((failedWebhooks / totalWebhooks) * 100).toFixed(1) : '0.0'

    // ── Email delivery (written by email-logger.ts) ──────────────
    const emailSnap = await adminDb.collection('email_deliveries').get()
    const recentEmails = emailSnap.docs
      .map(d => d.data())
      .filter(l => new Date(l.sentAt) >= twentyFourHoursAgo)
    const emailTotal = recentEmails.length
    const emailFailed = recentEmails.filter(l => !l.success).length
    const emailDeliveryRate = emailTotal > 0
      ? Math.round(((emailTotal - emailFailed) / emailTotal) * 100)
      : null

    // ── Expired OAuth tokens ─────────────────────────────────────
    const hostsSnap = await adminDb.collection('hosts').get()
    let expiredTokenUsers = 0
    await Promise.all(hostsSnap.docs.map(async doc => {
      const calsSnap = await doc.ref.collection('connected_calendars').get()
      const hasExpired = calsSnap.docs.some(c => {
        const exp = c.data().expiresAt
        return exp && new Date(exp).getTime() < now
      })
      if (hasExpired) expiredTokenUsers++
    }))

    // ── Last booking received ────────────────────────────────────
    const bookingsSnap = await adminDb
      .collection('bookings')
      .where('status', '==', 'confirmed')
      .get()
    const lastBooking = bookingsSnap.docs
      .map(d => d.data().createdAt as string)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null

    // ── Users with no calendar connected ────────────────────────
    let noCalendarUsers = 0
    await Promise.all(hostsSnap.docs.map(async doc => {
      const calsSnap = await doc.ref.collection('connected_calendars')
        .where('isActive', '==', true).limit(1).get()
      if (calsSnap.empty) noCalendarUsers++
    }))

    return Response.json({
      webhooks: { totalWebhooks, failedWebhooks, failureRate },
      email: { total: emailTotal, failed: emailFailed, deliveryRate: emailDeliveryRate },
      tokens: { expiredCount: expiredTokenUsers, totalUsers: hostsSnap.size },
      lastBooking,
      noCalendarUsers,
      totalUsers: hostsSnap.size,
    })
  } catch (error) {
    console.error('[system-health] error:', error)
    return Response.json({ error: 'Failed to load system health' }, { status: 500 })
  }
}
