import { requireAdminApi } from '@/lib/admin-session'
import { adminDb } from '@/lib/firebase/admin'


export async function GET(request: Request) {
  const adminCheck = await requireAdminApi(request)
  if (adminCheck instanceof Response) return adminCheck
  const user = adminCheck

  try {
    // Get delivery logs from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const logsSnap = await adminDb.collection('delivery_logs').get()
    const allLogs = logsSnap.docs.map(d => d.data())

    // Filter for emails from last 30 days
    const emailLogs = allLogs.filter(log => {
      const logTime = new Date(log.timestamp)
      return log.type === 'email' && logTime >= thirtyDaysAgo
    })

    // Group by email type
    const emailTypes = new Map<string, {sent: number; delivered: number; failed: number; bounced: number}>()

    emailLogs.forEach(log => {
      const emailType = log.details?.emailType || 'Unknown'
      if (!emailTypes.has(emailType)) {
        emailTypes.set(emailType, { sent: 0, delivered: 0, failed: 0, bounced: 0 })
      }

      const stats = emailTypes.get(emailType)!
      stats.sent++

      if (log.status === 'success') {
        stats.delivered++
      } else if (log.status === 'failed') {
        // Check if it's a bounce
        const error = log.details?.error || ''
        if (error.toLowerCase().includes('bounce') || error.toLowerCase().includes('invalid')) {
          stats.bounced++
        } else {
          stats.failed++
        }
      }
    })

    // Build response
    const deliveryData = Array.from(emailTypes.entries()).map(([type, stats]) => ({
      type,
      sent: stats.sent,
      delivered: stats.delivered,
      failed: stats.failed,
      bounced: stats.bounced,
      successRate: stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : '0',
    }))

    // Calculate totals
    const totalSent = emailLogs.length
    const totalDelivered = emailLogs.filter(log => log.status === 'success').length
    const totalFailed = emailLogs.filter(log => log.status === 'failed').length
    const totalBounced = emailLogs.filter(log => {
      const error = log.details?.error || ''
      return error.toLowerCase().includes('bounce') || error.toLowerCase().includes('invalid')
    }).length

    const overallSuccessRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'

    return Response.json({
      deliveryData: deliveryData.length > 0 ? deliveryData : [
        { type: 'No data', sent: 0, delivered: 0, failed: 0, bounced: 0, successRate: '0' },
      ],
      totalSent,
      totalDelivered,
      totalFailed,
      totalBounced,
      overallSuccessRate,
    })
  } catch (error) {
    console.error('[admin] email delivery stats error:', error)
    return Response.json({ error: 'Failed to load email delivery stats' }, { status: 500 })
  }
}
