export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import type { UserBillingDoc, TeamBillingDoc } from '@/types/billing'

export async function GET() {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user billing status
  const userBillingSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('billing')
    .doc('status')
    .get()

  const userBilling: UserBillingDoc | null = userBillingSnap.exists
    ? (userBillingSnap.data() as UserBillingDoc)
    : null

  // If user is a team member, also get team billing
  let teamBilling: TeamBillingDoc | null = null
  if (userBilling?.teamId) {
    const teamBillingSnap = await adminDb
      .collection('teams')
      .doc(userBilling.teamId)
      .collection('billing')
      .doc('status')
      .get()

    if (teamBillingSnap.exists) {
      teamBilling = teamBillingSnap.data() as TeamBillingDoc
    }
  }

  return NextResponse.json({
    user: userBilling,
    team: teamBilling,
  })
}
