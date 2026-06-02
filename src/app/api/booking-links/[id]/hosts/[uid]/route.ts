export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { stripe } from '@/lib/stripe'
import { syncTeamSeats } from '@/lib/billing/sync-team-seats'
import { Resend } from 'resend'
import { billingCouponRevokedEmail } from '@/lib/email-templates/billing-coupon-revoked'
import type { UserBillingDoc } from '@/types/billing'

async function getAuthedOwner(linkId: string) {
  const user = await getServerUser()
  if (!user) return null
  const linkSnap = await adminDb.collection('booking_links').doc(linkId).get()
  if (!linkSnap.exists || linkSnap.data()?.ownerId !== user.uid) return null
  return user
}

// DELETE: remove a host from the booking link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  const { id, uid } = await params
  const user = await getAuthedOwner(id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await adminDb
    .collection('booking_links').doc(id).collection('hosts').doc(uid).delete()

  // Check if removed user has a crossover coupon applied
  const userBillingSnap = await adminDb
    .collection('hosts')
    .doc(uid)
    .collection('billing')
    .doc('status')
    .get()

  if (userBillingSnap.exists) {
    const userBilling = userBillingSnap.data() as UserBillingDoc

    if (
      userBilling.tier === 'solo' &&
      userBilling.crossoverCouponActive === true &&
      userBilling.subscriptionId
    ) {
      try {
        // Strip the coupon from their subscription
        await stripe.subscriptions.update(userBilling.subscriptionId, {
          discounts: [],
        })

        // Update Firestore
        await userBillingSnap.ref.update({ crossoverCouponActive: false })

        // Send notification email
        const removedUserSnap = await adminDb.collection('hosts').doc(uid).get()
        const removedUser = removedUserSnap.data() as any

        if (removedUser?.email) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const emailHtml = billingCouponRevokedEmail({
            name: removedUser.name || 'User',
            newMonthlyAmount: '$10/month',
          })

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: removedUser.email,
            subject: 'Your team discount has been removed',
            html: emailHtml,
          })
        }
      } catch (error) {
        console.error('[hosts-delete] Error stripping coupon:', error)
      }
    }
  }

  // Sync team seats for the owner
  await syncTeamSeats(user.uid)

  return NextResponse.json({ success: true })
}

// PATCH: update a host's priority
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  const { id, uid } = await params
  const user = await getAuthedOwner(id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priority } = await request.json()
  if (typeof priority !== 'number') {
    return NextResponse.json({ error: 'priority must be a number' }, { status: 400 })
  }

  await adminDb
    .collection('booking_links').doc(id).collection('hosts').doc(uid).update({
      priority: Math.max(1, Math.min(10, Math.round(priority))),
    })

  return NextResponse.json({ success: true })
}
