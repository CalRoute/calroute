import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { updateIssue, addIssueComment } from '@/lib/github-issues'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticketId } = await params
  const number = parseInt(ticketId, 10)
  if (isNaN(number)) return Response.json({ error: 'Invalid issue number' }, { status: 400 })

  const updates = await request.json()

  try {
    const ghUpdates: Parameters<typeof updateIssue>[1] = {}

    if (updates.status === 'resolved' || updates.status === 'closed') {
      ghUpdates.state = 'closed'
    } else if (updates.status === 'open' || updates.status === 'in-progress') {
      ghUpdates.state = 'open'
    }

    if (Object.keys(ghUpdates).length > 0) {
      await updateIssue(number, ghUpdates)
    }

    if (updates.note) {
      await addIssueComment(number, `**Admin note:** ${updates.note}`)
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[support/patch] error:', error)
    return Response.json({ error: 'Failed to update GitHub issue' }, { status: 500 })
  }
}
