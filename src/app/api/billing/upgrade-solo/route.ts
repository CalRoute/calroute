export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { stripe } from '@/lib/stripe'
import type { UserBillingDoc, TeamBillingDoc } from '@/types/billing'

export async function POST() {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user is a team member
  const userBillingSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('billing')
    .doc('status')
    .get()

  if (!userBillingSnap.exists) {
    return NextResponse.json(
      { error: 'User billing status not found' },
      { status: 404 }
    )
  }

  const userBilling = userBillingSnap.data() as UserBillingDoc

  if (userBilling.tier !== 'team_member') {
    return NextResponse.json(
      { error: 'User is not a team member' },
      { status: 400 }
    )
  }

  if (!userBilling.teamId) {
    return NextResponse.json(
      { error: 'Team ID not found' },
      { status: 400 }
    )
  }

  // Verify team subscription is active
  const teamBillingSnap = await adminDb
    .collection('teams')
    .doc(userBilling.teamId)
    .collection('billing')
    .doc('status')
    .get()

  if (!teamBillingSnap.exists) {
    return NextResponse.json(
      { error: 'Team billing status not found' },
      { status: 404 }
    )
  }

  const teamBilling = teamBillingSnap.data() as TeamBillingDoc

  if (teamBilling.status !== 'active') {
    return NextResponse.json(
      { error: 'Team subscription is not active' },
      { status: 400 }
    )
  }

  // Get or create Stripe customer
  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data() as any
  let customerId = host?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { uid: user.uid },
    })
    customerId = customer.id

    // Save to Firestore
    await hostSnap.ref.update({ stripeCustomerId: customerId })
  }

  // Create checkout session with crossover coupon
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_SOLO_PRICE_ID!,
        quantity: 1,
      },
    ],
    discounts: [
      {
        coupon: process.env.STRIPE_TEAM_CROSSOVER_COUPON_ID!,
      },
    ],
    success_url: `${appUrl}/dashboard/settings?billing=success`,
    cancel_url: `${appUrl}/dashboard/settings?billing=cancel`,
    client_reference_id: user.uid,
    metadata: { plan: 'solo_crossover', uid: user.uid },
  })

  return NextResponse.json({ url: session.url })
}
