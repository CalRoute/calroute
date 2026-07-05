import { getAdminSession } from '@/lib/session'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [hostsSnap, accountsSnap] = await Promise.all([
      adminDb.collection('hosts').get(),
      adminDb.collection('user_accounts').get(),
    ])

    const actionedMap = new Map(accountsSnap.docs.map(d => [d.id, d.data()]))

    // Fetch billing docs in parallel to check VIP status
    const billingDocs = await Promise.all(
      hostsSnap.docs.map(doc =>
        adminDb.collection('hosts').doc(doc.id).collection('billing').doc('status').get()
      )
    )
    const billingMap = new Map(
      hostsSnap.docs.map((doc, i) => [doc.id, billingDocs[i].data()])
    )

    const accounts = hostsSnap.docs.map(doc => {
      const host = doc.data()
      const actioned = actionedMap.get(doc.id)
      const billing = billingMap.get(doc.id)
      return {
        uid: doc.id,
        email: host.email || '',
        name: host.name || '',
        createdAt: host.createdAt || '',
        status: (actioned?.status ?? 'active') as 'active' | 'disabled' | 'deleted',
        disabledAt: actioned?.disabledAt,
        disabledReason: actioned?.disabledReason,
        isVip: billing?.tier === 'vip',
      }
    })

    return Response.json({ accounts })
  } catch (error) {
    console.error('[accounts] error:', error)
    return Response.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
