import { adminDb } from '@/lib/firebase/admin'
import type { UserBillingDoc } from '@/types/billing'

export type BillingTier = 'free_trial' | 'solo' | 'team_member' | 'vip'

export interface UserBilling {
  tier: BillingTier
  status: UserBillingDoc['status']
  isPaid: boolean   // solo or team_member with active/trialing subscription
  isFree: boolean   // free_trial or no billing doc
}

export async function getUserBilling(uid: string): Promise<UserBilling> {
  const snap = await adminDb
    .collection('hosts').doc(uid)
    .collection('billing').doc('status')
    .get()

  if (!snap.exists) {
    return { tier: 'free_trial', status: 'trialing', isPaid: false, isFree: true }
  }

  const doc = snap.data() as UserBillingDoc
  const isPaid =
    doc.tier === 'vip' ||
    ((doc.tier === 'solo' || doc.tier === 'team_member') &&
    (doc.status === 'active' || doc.status === 'trialing'))

  return {
    tier: doc.tier,
    status: doc.status,
    isPaid,
    isFree: !isPaid,
  }
}
