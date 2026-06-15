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

    // Build a map of manually-actioned statuses
    const actionedMap = new Map(accountsSnap.docs.map(d => [d.id, d.data()]))

    const accounts = hostsSnap.docs.map(doc => {
      const host = doc.data()
      const actioned = actionedMap.get(doc.id)
      return {
        uid: doc.id,
        email: host.email || '',
        name: host.name || '',
        createdAt: host.createdAt || '',
        status: (actioned?.status ?? 'active') as 'active' | 'disabled' | 'deleted',
        disabledAt: actioned?.disabledAt,
        disabledReason: actioned?.disabledReason,
      }
    })

    return Response.json({ accounts })
  } catch (error) {
    console.error('[accounts] error:', error)
    return Response.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
