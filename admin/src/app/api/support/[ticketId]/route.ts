import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { updateTicketStatus, assignTicket, TicketStatus } from '@/lib/support-tickets'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticketId } = await params
  const updates = await request.json()

  try {
    if (updates.status) {
      await updateTicketStatus(ticketId, updates.status as TicketStatus)
    }
    if ('assignedTo' in updates) {
      await assignTicket(ticketId, updates.assignedTo || '')
    }
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[support/patch] error:', error)
    return Response.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
