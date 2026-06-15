import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const logsSnap = await adminDb.collection('delivery_logs').get()
    const emailLogs = logsSnap.docs
      .map(d => d.data())
      .filter(l => l.type === 'email' && new Date(l.timestamp) >= thirtyDaysAgo)

    const templateTypes = [
      'Booking Confirmation',
      'Booking Reminder',
      'Cancellation Notice',
      'Reschedule Confirmation',
      'Welcome Email',
    ]

    const templateMetrics = new Map<string, { sent: number; successful: number }>(
      templateTypes.map(t => [t, { sent: 0, successful: 0 }])
    )

    emailLogs.forEach(log => {
      const emailType = (log.details?.emailType || '').toLowerCase()
      let name = 'Other'
      if (emailType.includes('confirmation')) name = 'Booking Confirmation'
      else if (emailType.includes('reminder')) name = 'Booking Reminder'
      else if (emailType.includes('cancel')) name = 'Cancellation Notice'
      else if (emailType.includes('reschedule')) name = 'Reschedule Confirmation'
      else if (emailType.includes('welcome')) name = 'Welcome Email'

      if (!templateMetrics.has(name)) templateMetrics.set(name, { sent: 0, successful: 0 })
      const m = templateMetrics.get(name)!
      m.sent++
      if (log.status === 'success') m.successful++
    })

    const metrics = Array.from(templateMetrics.entries())
      .filter(([, d]) => d.sent > 0)
      .map(([templateName, d]) => ({
        templateName,
        sent: d.sent,
        delivered: d.successful,
        deliveryRate: d.sent > 0 ? parseFloat(((d.successful / d.sent) * 100).toFixed(1)) : 0,
        // Open/click tracking is not implemented — do not show fabricated rates
        openRate: null as number | null,
        clickRate: null as number | null,
      }))
      .sort((a, b) => b.sent - a.sent)

    const totalSent = metrics.reduce((a, b) => a + b.sent, 0)

    return Response.json({ metrics, totalSent, openRateTracked: false, clickRateTracked: false })
  } catch (error) {
    console.error('[admin] email template stats error:', error)
    return Response.json({ error: 'Failed to load email template stats' }, { status: 500 })
  }
}
