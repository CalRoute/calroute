export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { stripe } from '@/lib/stripe'
import { Resend } from 'resend'
import { accountDeletedEmail } from '@/lib/email-templates/account-deleted'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function DELETE() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = user.uid

  try {
    const hostSnap = await adminDb.collection('hosts').doc(uid).get()
    const hostData = hostSnap.data()

    // Send goodbye email before deleting (fire-and-forget)
    if (hostData?.email) {
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: hostData.email,
        subject: 'Your CalRoute account has been deleted',
        html: accountDeletedEmail({
          name: hostData.name ?? 'there',
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        }),
      }).catch(e => console.error('[goodbye-email] failed:', e))
    }

    // Cancel Stripe subscription if one exists
    const stripeCustomerId = hostData?.stripeCustomerId
    if (stripeCustomerId) {
      try {
        const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, limit: 10 })
        await Promise.all(
          subs.data
            .filter(s => s.status !== 'canceled')
            .map(s => stripe.subscriptions.cancel(s.id))
        )
      } catch (e) {
        console.error('[delete-account] stripe cancel error:', e)
        // Don't block deletion if Stripe fails
      }
    }

    // Delete all Firestore data
    await Promise.all([
      // Host subcollections
      deleteSubcollection(uid, 'connected_calendars'),
      deleteSubcollection(uid, 'availability'),
      deleteSubcollection(uid, 'blackout_dates'),
      deleteSubcollection(uid, 'api_keys'),
      deleteSubcollection(uid, 'webhooks'),
      // Booking links owned by user
      deleteUserBookingLinks(uid),
      // User's bookings as host
      deleteUserBookings(uid),
      // User billing doc
      adminDb.collection('billing').doc(uid).delete().catch(() => {}),
      // User roles
      adminDb.collection('user_roles').doc(uid).delete().catch(() => {}),
    ])

    // Delete host document
    await adminDb.collection('hosts').doc(uid).delete()

    // Delete Firebase Auth user
    await adminAuth.deleteUser(uid)

    // Clear session cookie in response
    const response = NextResponse.json({ ok: true })
    response.cookies.delete('calroute-session')
    response.cookies.delete('calroute-refresh')
    return response
  } catch (error) {
    console.error('[delete-account] error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}

async function deleteSubcollection(uid: string, name: string) {
  const snap = await adminDb.collection('hosts').doc(uid).collection(name).get()
  await Promise.all(snap.docs.map(d => d.ref.delete()))
}

async function deleteUserBookingLinks(uid: string) {
  const linksSnap = await adminDb.collection('booking_links').where('ownerId', '==', uid).get()
  await Promise.all(linksSnap.docs.map(async d => {
    // Delete hosts subcollection inside each link
    const hostsSnap = await d.ref.collection('hosts').get()
    await Promise.all(hostsSnap.docs.map(h => h.ref.delete()))
    await d.ref.delete()
  }))
}

async function deleteUserBookings(uid: string) {
  const snap = await adminDb.collection('bookings').where('hostId', '==', uid).get()
  await Promise.all(snap.docs.map(d => d.ref.delete()))
}
