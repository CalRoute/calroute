import { requireUser } from '@/lib/firebase/session'
import { createSupportTicket, getAllTickets, getTicketStats } from '@/lib/support-tickets'

export async function POST(request: Request) {
  const user = await requireUser('/dashboard')
  const { subject, description, priority = 'medium', category = 'other' } = await request.json()

  if (!subject || !description) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const ticketId = await createSupportTicket({
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.email?.split('@')[0] || 'Unknown',
      subject,
      description,
      priority,
      status: 'open',
      category,
    })

    if (!ticketId) {
      return Response.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    return Response.json({ id: ticketId, success: true })
  } catch (error) {
    console.error('[support] error:', error)
    return Response.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as any

  try {
    const tickets = await getAllTickets({ status })
    const stats = await getTicketStats()
    return Response.json({ tickets, stats })
  } catch (error) {
    console.error('[support] error:', error)
    return Response.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}
