import { adminDb } from '@/lib/firebase/admin'
import crypto from 'crypto'

function signPayload(secret: string, payload: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export async function fireWebhooks(
  hostId: string,
  event: 'booking.confirmed' | 'booking.cancelled' | 'booking.rescheduled' | 'booking.transferred' | 'team.host_added' | 'team.host_removed' | 'subscription.confirmed' | 'subscription.payment_failed',
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

      // Fire async, don't await
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CalRoute-Signature': signature,
          'X-CalRoute-Event': event,
        },
        body: payloadStr,
      }).catch(e => console.error(`[webhook] failed for ${webhook.url}:`, e))
    }
  } catch (error) {
    console.error('[fireWebhooks] error:', error)
  }
}
