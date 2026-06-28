import { adminDb } from '@/lib/firebase/admin'

export async function logEmailDelivery(data: {
  type: 'booking_confirmed' | 'booking_cancelled' | 'booking_rescheduled'
  to: string
  subject: string
  success: boolean
  error?: string
}) {
  try {
    await adminDb.collection('email_deliveries').add({
      ...data,
      sentAt: new Date().toISOString(),
    })
  } catch {
    // never block the main flow
  }
}
