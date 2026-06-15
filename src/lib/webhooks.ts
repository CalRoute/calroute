import { adminDb } from '@/lib/firebase/admin'
import crypto from 'crypto'

function signPayload(secret: string, payload: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

async function logWebhookFailure(webhookId: string, url: string, statusCode: number, errorMsg: string, hostId: string) {
  try {
    await adminDb.collection('error_logs').add({
      timestamp: new Date().toISOString(),
      message: `Webhook delivery failed to ${url}`,
      endpoint: url,
      userId: hostId,
      errorType: 'webhook_delivery',
      severity: statusCode >= 500 ? 'high' : 'medium',
      context: { webhookId, statusCode, error: errorMsg },
    })
  } catch {
    // Never throw from logging
  }
}

export async function fireWebhooks(
  hostId: string,
  event: 'booking.confirmed' | 'booking.cancelled' | 'booking.rescheduled' | 'booking.transferred' | 'team.host_added' | 'team.host_removed' | 'subscription.confirmed' | 'subscription.payment_failed' | 'meeting.notes_saved',
  payload: Record<string, any>
): Promise<void> {
  try {
    const webhooksSnap = await adminDb
      .collection('hosts')
      .doc(hostId)
      .collection('webhooks')
      .where('isActive', '==', true)
      .get()

    for (const doc of webhooksSnap.docs) {
      const webhook = doc.data()
      if (!webhook.events?.includes(event)) continue

      const payloadStr = JSON.stringify(payload)
      const signature = signPayload(webhook.secret, payloadStr)

      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CalRoute-Signature': signature,
          'X-CalRoute-Event': event,
        },
        body: payloadStr,
      }).then(async res => {
        if (!res.ok) {
          await logWebhookFailure(doc.id, webhook.url, res.status, `HTTP ${res.status}`, hostId)
        }
      }).catch(async e => {
        console.error(`[webhook] failed for ${webhook.url}:`, e)
        await logWebhookFailure(doc.id, webhook.url, 0, String(e), hostId)
      })
    }
  } catch (error) {
    console.error('[fireWebhooks] error:', error)
  }
}
