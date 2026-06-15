import { requireAdminApi } from '@/lib/admin-session'
import { adminDb } from '@/lib/firebase/admin'


export async function GET(request: Request) {
  const adminCheck = await requireAdminApi(request)
  if (adminCheck instanceof Response) return adminCheck
  const user = adminCheck

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
