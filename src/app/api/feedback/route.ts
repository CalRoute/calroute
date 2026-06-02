import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

export async function POST(request: Request) {
  const user = await requireUser('/dashboard')

  const { type, title, message, priority } = await request.json() as {
    type: 'bug' | 'feature' | 'feedback'
    title: string
    message: string
    priority?: 'low' | 'medium' | 'high'
  }

  if (!type || !title || !message) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    await adminDb.collection('feedback').add({
      userId: user.uid,
      userEmail: user.email,
      type,
      title,
      message,
      priority: priority || 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('[feedback] error:', error)
    return Response.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')

  try {
    // Get user's own feedback
    const snap = await adminDb
      .collection('feedback')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get()

    const feedback = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }))

    return Response.json({ feedback })
  } catch (error) {
    console.error('[feedback] error:', error)
    return Response.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
