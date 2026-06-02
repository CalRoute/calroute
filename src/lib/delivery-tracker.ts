import { adminDb } from './firebase/admin'

export interface DeliveryLog {
  type: 'email' | 'calendar_sync'
  userId: string
  status: 'success' | 'failed' | 'pending'
  timestamp: string
  details?: Record<string, any>
}

export async function trackEmailDelivery(
  userId: string,
  recipient: string,
  emailType: string,
  status: 'success' | 'failed',
  messageId?: string,
  error?: string
) {
  try {
    await adminDb.collection('delivery_logs').add({
      type: 'email',
      userId,
      status,
      timestamp: new Date().toISOString(),
      details: {
        recipient,
        emailType,
        messageId,
        error,
      },
    })
  } catch (err) {
    console.error('[delivery-tracker] Failed to log email:', err)
  }
}

export async function trackCalendarSync(
  userId: string,
  calendarId: string,
  status: 'success' | 'failed',
  eventCount?: number,
  error?: string
) {
  try {
    await adminDb.collection('delivery_logs').add({
      type: 'calendar_sync',
      userId,
      status,
      timestamp: new Date().toISOString(),
      details: {
        calendarId,
        eventCount,
        error,
      },
    })
  } catch (err) {
    console.error('[delivery-tracker] Failed to log calendar sync:', err)
  }
}

export async function getDeliveryStats(hours = 24) {
  const startTime = new Date()
  startTime.setHours(startTime.getHours() - hours)

  const emailSnap = await adminDb
    .collection('delivery_logs')
    .where('type', '==', 'email')
    .where('timestamp', '>=', startTime.toISOString())
    .get()

  const syncSnap = await adminDb
    .collection('delivery_logs')
    .where('type', '==', 'calendar_sync')
    .where('timestamp', '>=', startTime.toISOString())
    .get()

  const emails = emailSnap.docs.map(d => d.data())
  const syncs = syncSnap.docs.map(d => d.data())

  const emailStats = {
    total: emails.length,
    successful: emails.filter(e => e.status === 'success').length,
    failed: emails.filter(e => e.status === 'failed').length,
    successRate: emails.length > 0 ? ((emails.filter(e => e.status === 'success').length / emails.length) * 100).toFixed(1) : '100',
  }

  const syncStats = {
    total: syncs.length,
    successful: syncs.filter(s => s.status === 'success').length,
    failed: syncs.filter(s => s.status === 'failed').length,
    successRate: syncs.length > 0 ? ((syncs.filter(s => s.status === 'success').length / syncs.length) * 100).toFixed(1) : '100',
  }

  return { emailStats, syncStats }
}
