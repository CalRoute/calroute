export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminDb } from '@/lib/firebase/admin'
import { syncTeamSeats } from '@/lib/billing/sync-team-seats'
import { Resend } from 'resend'
import { billingPaymentFailedEmail } from '@/lib/email-templates/billing-payment-failed'
import type { UserBillingDoc, TeamBillingDoc } from '@/types/billing'

const resend = new Resend(process.env.RESEND_API_KEY)

async function activateSubscription(session: any) {
  const plan = session.metadata?.plan as string
  const uid = session.metadata?.uid as string

  if (!uid) {
    console.error('[webhook] Missing UID in session metadata')
    return
  }

  const hostSnap = await adminDb.collection('hosts').doc(uid).get()
  const host = hostSnap.data() as any

  if (plan === 'solo' || plan === 'solo_crossover') {
    // Solo plan subscription
    await adminDb
      .collection('hosts')
      .doc(uid)
      .collection('billing')
      .doc('status')
      .set(
        {
          tier: 'solo',
          status: 'active',
          subscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          teamId: null,
          crossoverCouponActive: plan === 'solo_crossover',
        } as UserBillingDoc,
        { merge: true }
      )
  } else if (plan === 'team') {
    // Team plan subscription
    await adminDb
      .collection('teams')
      .doc(uid)
      .collection('billing')
      .doc('status')
      .set(
        {
          subscriptionId: session.subscription,
          status: 'active',
          stripeCustomerId: session.customer,
          adminOwnerId: uid,
          currentSeats: 0,
        } as TeamBillingDoc,
        { merge: true }
      )

    // Also mark owner as having solo tier (for personal access)
    await adminDb
      .collection('hosts')
      .doc(uid)
      .collection('billing')
      .doc('status')
      .set(
        {
          tier: 'solo',
          status: 'active',
          subscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          teamId: null,
        } as UserBillingDoc,
        { merge: true }
      )

    // Sync the team's current seat count
    await syncTeamSeats(uid)
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        await activateSubscription(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        // Find the user(s) with this stripe customer ID
        const hostSnap = await adminDb
          .collection('hosts')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (hostSnap.empty) {
          console.warn('[webhook] No host found for customer:', customerId)
          break
        }

        const uid = hostSnap.docs[0].id

        // Update user billing status
        const newStatus = mapStripeStatus(subscription.status)
        await adminDb
          .collection('hosts')
          .doc(uid)
          .collection('billing')
          .doc('status')
          .update({ status: newStatus })

        // Also update team billing if this is a team owner
        const teamBillingSnap = await adminDb
          .collection('teams')
          .doc(uid)
          .collection('billing')
          .doc('status')
          .get()

        if (teamBillingSnap.exists) {
          await teamBillingSnap.ref.update({ status: newStatus })
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        // Find the user(s) with this stripe customer ID
        const hostSnap = await adminDb
          .collection('hosts')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (hostSnap.empty) {
          console.warn('[webhook] No host found for customer:', customerId)
          break
        }

        const uid = hostSnap.docs[0].id

        // Mark as expired
        await adminDb
          .collection('hosts')
          .doc(uid)
          .collection('billing')
          .doc('status')
          .update({ status: 'expired' })

        // Also update team billing if this is a team owner
        const teamBillingSnap = await adminDb
          .collection('teams')
          .doc(uid)
          .collection('billing')
          .doc('status')
          .get()

        if (teamBillingSnap.exists) {
          await teamBillingSnap.ref.update({ status: 'expired' })
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const customerId = invoice.customer

        // Find the user(s) with this stripe customer ID
        const hostSnap = await adminDb
          .collection('hosts')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (hostSnap.empty) {
          console.warn('[webhook] No host found for customer:', customerId)
          break
        }

        const uid = hostSnap.docs[0].id
        const host = hostSnap.docs[0].data() as any

        // Update status to past_due
        await adminDb
          .collection('hosts')
          .doc(uid)
          .collection('billing')
          .doc('status')
          .update({ status: 'past_due' })

        // Also update team billing if this is a team owner
        const teamBillingSnap = await adminDb
          .collection('teams')
          .doc(uid)
          .collection('billing')
          .doc('status')
          .get()

        if (teamBillingSnap.exists) {
          await teamBillingSnap.ref.update({ status: 'past_due' })
        }

        // Send payment failed email
        try {
          const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/portal`
          const emailHtml = billingPaymentFailedEmail({
            name: host.name || 'User',
            planName: 'Your plan',
            portalUrl,
          })

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: host.email,
            subject: 'Payment failed for your CalRoute subscription',
            html: emailHtml,
          })
        } catch (emailErr) {
          console.error('[webhook] Email sending failed:', emailErr)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const customerId = invoice.customer

        // Find the user(s) with this stripe customer ID
        const hostSnap = await adminDb
          .collection('hosts')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get()

        if (hostSnap.empty) {
          console.warn('[webhook] No host found for customer:', customerId)
          break
        }

        const uid = hostSnap.docs[0].id

        // Ensure status is active
        const userBillingSnap = await adminDb
          .collection('hosts')
          .doc(uid)
          .collection('billing')
          .doc('status')
          .get()

        if (userBillingSnap.exists) {
          const currentStatus = userBillingSnap.data()?.status
          if (currentStatus === 'past_due') {
            await userBillingSnap.ref.update({ status: 'active' })
          }
        }

        // Also update team billing if this is a team owner
        const teamBillingSnap = await adminDb
          .collection('teams')
          .doc(uid)
          .collection('billing')
          .doc('status')
          .get()

        if (teamBillingSnap.exists) {
          const currentStatus = teamBillingSnap.data()?.status
          if (currentStatus === 'past_due') {
            await teamBillingSnap.ref.update({ status: 'active' })
          }
        }

        break
      }

      default:
        console.log('[webhook] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhook] Error processing event:', error)
    return NextResponse.json({ error: 'Error processing event' }, { status: 500 })
  }
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    default:
      return 'expired'
  }
}
