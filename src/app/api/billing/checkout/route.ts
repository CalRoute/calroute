export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, coupon } = await request.json() as { plan: 'solo' | 'team'; coupon?: string }

    if (!plan || !['solo', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'plan must be "solo" or "team"' }, { status: 400 })
    }

    // Validate env vars
    if (!process.env.STRIPE_SOLO_PRICE_ID || !process.env.STRIPE_TEAM_BASE_PRICE_ID || !process.env.STRIPE_TEAM_SEAT_PRICE_ID) {
      console.error('[checkout] Missing Stripe price IDs:', {
        solo: !!process.env.STRIPE_SOLO_PRICE_ID,
        teamBase: !!process.env.STRIPE_TEAM_BASE_PRICE_ID,
        teamSeat: !!process.env.STRIPE_TEAM_SEAT_PRICE_ID,
      })
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
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

    // Create checkout session
    let lineItems: { price: string; quantity: number }[] = []

    if (plan === 'solo') {
      lineItems = [
        {
          price: process.env.STRIPE_SOLO_PRICE_ID,
          quantity: 1,
        },
      ]
    } else {
      // Team plan: base + seats
      const linksSnap = await adminDb
        .collection('booking_links')
        .where('ownerId', '==', user.uid)
        .get()

      const hostIds = new Set<string>()
      for (const linkDoc of linksSnap.docs) {
        const hostsSnap = await adminDb
          .collection('booking_links')
          .doc(linkDoc.id)
          .collection('hosts')
          .get()
        hostsSnap.docs.forEach(h => hostIds.add(h.data().hostId))
      }

      const seatCount = Math.max(1, hostIds.size)

      lineItems = [
        {
          price: process.env.STRIPE_TEAM_BASE_PRICE_ID,
          quantity: 1,
        },
        {
          price: process.env.STRIPE_TEAM_SEAT_PRICE_ID,
          quantity: seatCount,
        },
      ]
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const checkoutParams: any = {
      customer: customerId,
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${appUrl}/dashboard/billing/success`,
      cancel_url: `${appUrl}/dashboard/settings?billing=cancel`,
      client_reference_id: user.uid,
      metadata: { plan, uid: user.uid },
    }

    // Add coupon if provided
    if (coupon) {
      checkoutParams.discounts = [{ coupon }]
    }

    const session = await stripe.checkout.sessions.create(checkoutParams)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[checkout] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
