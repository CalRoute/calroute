import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

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
