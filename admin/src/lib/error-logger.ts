import { adminDb } from './firebase/admin'

export interface ErrorLog {
  timestamp: string
  message: string
  stack?: string
  endpoint?: string
  userId?: string
  errorType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
}

export async function logError(error: ErrorLog) {
  try {
    await adminDb.collection('error_logs').add({
      ...error,
      timestamp: error.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[error-logger] Failed to log error:', err)
  }
}

export async function logWebhookFailure(
  webhookId: string,
  endpoint: string,
  statusCode: number,
  error: string,
  userId: string
) {
  await logError({
    timestamp: new Date().toISOString(),
    message: `Webhook delivery failed to ${endpoint}`,
    endpoint,
    userId,
    errorType: 'webhook_delivery',
    severity: statusCode >= 500 ? 'high' : 'medium',
    context: {
      webhookId,
      statusCode,
      error,
    },
  })
}

export async function logCalendarSyncError(
  userId: string,
  calendarId: string,
  error: string,
  severity: 'low' | 'medium' | 'high' = 'medium'
) {
  await logError({
    timestamp: new Date().toISOString(),
    message: `Calendar sync failed for ${calendarId}`,
    userId,
    errorType: 'calendar_sync',
    severity,
    context: {
      calendarId,
      error,
    },
  })
}

export async function logEmailDeliveryError(
  userId: string,
  recipient: string,
  error: string,
  emailType: string
) {
  await logError({
    timestamp: new Date().toISOString(),
    message: `Email delivery failed to ${recipient}`,
    userId,
    errorType: 'email_delivery',
    severity: 'high',
    context: {
      recipient,
      emailType,
      error,
    },
  })
}

export async function getRecentErrors(limit = 50) {
  const snap = await adminDb
    .collection('error_logs')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get()

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }))
}

export async function getErrorStats() {
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const snap = await adminDb
    .collection('error_logs')
    .where('timestamp', '>=', oneDayAgo.toISOString())
    .get()

  const errors = snap.docs.map(d => d.data())

  const byType = {} as Record<string, number>
  const bySeverity = {} as Record<string, number>

  errors.forEach(error => {
    byType[error.errorType] = (byType[error.errorType] || 0) + 1
    bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
  })

  return {
    totalErrors: errors.length,
    byType,
    bySeverity,
    criticalCount: bySeverity['critical'] || 0,
  }
}
