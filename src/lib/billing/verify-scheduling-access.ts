import { adminDb } from '@/lib/firebase/admin'
import type { TeamBillingDoc, UserBillingDoc } from '@/types/billing'

export async function verifySchedulingAccess(
  ownerId: string,
  isTeamLink: boolean
): Promise<{ allowed: boolean; code?: string }> {
  if (isTeamLink) {
    // Check team billing status
    const teamBillingSnap = await adminDb.collection('teams').doc(ownerId).collection('billing').doc('status').get()

    if (!teamBillingSnap.exists) {
      return { allowed: true } // Free trial / legacy
    }

    const teamBilling = teamBillingSnap.data() as TeamBillingDoc

    if (['expired', 'canceled', 'past_due'].includes(teamBilling.status)) {
      return { allowed: false, code: 'LINK_INACTIVE' }
    }

    // Count distinct hosts across all booking links
    const linksSnap = await adminDb
      .collection('booking_links')
      .where('ownerId', '==', ownerId)
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

    const liveCount = hostIds.size
    if (liveCount > teamBilling.currentSeats) {
      return { allowed: false, code: 'SEAT_LIMIT_EXCEEDED' }
    }

    return { allowed: true }
  }

  // Solo link check
  const userBillingSnap = await adminDb.collection('hosts').doc(ownerId).collection('billing').doc('status').get()

  if (!userBillingSnap.exists) {
    return { allowed: true } // Free trial / legacy
  }

  const userBilling = userBillingSnap.data() as UserBillingDoc

  // VIP users always have full access
  if (userBilling.tier === 'vip') {
    return { allowed: true }
  }

  if (!['active', 'trialing'].includes(userBilling.status)) {
    return { allowed: false, code: 'LINK_INACTIVE' }
  }

  if (userBilling.tier === 'team_member') {
    return { allowed: false, code: 'TEAM_MEMBER_STANDALONE_BLOCKED' }
  }

  return { allowed: true }
}
