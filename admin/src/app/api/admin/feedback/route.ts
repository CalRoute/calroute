import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'


export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const user = { uid: session.uid, email: session.email }

  try {
    const snap = await adminDb
      .collection('feedback')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()

    const feedback = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as any[]

    // Count by type
    const byType = {} as Record<string, number>
    feedback.forEach((f: any) => {
      if (f.type) {
        byType[f.type] = (byType[f.type] || 0) + 1
      }
    })

    return Response.json({ feedback, stats: { total: feedback.length, byType } })
  } catch (error) {
    console.error('[admin-feedback] error:', error)
    return Response.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
