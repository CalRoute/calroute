import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'

// POST { uid, grant: true|false }
export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { uid, grant } = await request.json()
  if (!uid || typeof grant !== 'boolean') {
    return Response.json({ error: 'uid and grant (boolean) required' }, { status: 400 })
  }

  try {
    const billingRef = adminDb.collection('hosts').doc(uid).collection('billing').doc('status')

    if (grant) {
      await billingRef.set({
        tier: 'vip',
        status: 'active',
        subscriptionId: null,
        stripeCustomerId: null,
        teamId: null,
      }, { merge: true })
    } else {
      // Revoke VIP — reset to free_trial
      await billingRef.set({
        tier: 'free_trial',
        status: 'trialing',
        subscriptionId: null,
        stripeCustomerId: null,
        teamId: null,
      }, { merge: true })
    }

    return Response.json({ ok: true, uid, vip: grant })
  } catch (error) {
    console.error('[vip] error:', error)
    return Response.json({ error: 'Failed to update VIP status' }, { status: 500 })
  }
}
