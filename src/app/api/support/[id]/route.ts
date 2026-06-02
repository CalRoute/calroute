import { requireUser } from '@/lib/firebase/session'
import { updateTicketStatus, assignTicket, addTicketNote } from '@/lib/support-tickets'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser('/dashboard')
  const { id } = await params
  const { status, assignedTo, note } = await request.json()

  // Only admins can update tickets
  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    if (status) {
      await updateTicketStatus(id, status)
    }
    if (assignedTo) {
      await assignTicket(id, assignedTo)
    }
    if (note) {
      await addTicketNote(id, note, user.email || 'Admin')
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[support] error updating ticket:', error)
    return Response.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
