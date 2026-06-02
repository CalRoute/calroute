import { adminDb } from '@/lib/firebase/admin'
import { stripe } from '@/lib/stripe'
import type { TeamBillingDoc } from '@/types/billing'

export async function syncTeamSeats(ownerUid: string): Promise<void> {
  try {
    // 1. Get all booking links owned by this user
    const linksSnap = await adminDb
      .collection('booking_links')
      .where('ownerId', '==', ownerUid)
      .get()

    // 2. Collect all unique hostIds
    const hostIds = new Set<string>()
    for (const linkDoc of linksSnap.docs) {
      const hostsSnap = await adminDb
        .collection('booking_links')
        .doc(linkDoc.id)
        .collection('hosts')
        .get()
      hostsSnap.docs.forEach(h => hostIds.add(h.data().hostId))
    }

    const uniqueCount = hostIds.size

    // 3. Get team billing doc
    const teamBillingSnap = await adminDb
      .collection('teams')
      .doc(ownerUid)
      .collection('billing')
      .doc('status')
      .get()

    if (!teamBillingSnap.exists) {
      return // No team subscription yet
    }

    const teamBilling = teamBillingSnap.data() as TeamBillingDoc
    if (!teamBilling.subscriptionId) {
      return // No Stripe subscription
    }

    // 4. Retrieve Stripe subscription and find seat price line item
    const subscription = await stripe.subscriptions.retrieve(teamBilling.subscriptionId)

    const seatItemId = subscription.items.data.find(
      item => item.price.id === process.env.STRIPE_TEAM_SEAT_PRICE_ID
    )?.id

    if (!seatItemId) {
      return // Seat price not found
    }

    // 5. Update quantity with idempotency key
    await stripe.subscriptions.update(
      teamBilling.subscriptionId,
      {
        items: [{ id: seatItemId, quantity: uniqueCount }],
      },
      {
        idempotencyKey: `sync-seats-${ownerUid}-${uniqueCount}`,
      }
    )

    // 6. Update Firestore with new seat count
    await adminDb
      .collection('teams')
      .doc(ownerUid)
      .collection('billing')
      .doc('status')
      .update({ currentSeats: uniqueCount })
  } catch (error) {
    console.error(`[syncTeamSeats] Error syncing seats for ${ownerUid}:`, error)
    // Don't throw; let the caller decide whether this is critical
  }
}
