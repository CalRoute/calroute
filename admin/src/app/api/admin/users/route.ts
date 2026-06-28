import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const hostsSnap = await adminDb.collection('hosts').get()
    const users = hostsSnap.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      createdAt: doc.data().createdAt,
    }))
    return Response.json({ users })
  } catch (error) {
    console.error('[users] error:', error)
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
