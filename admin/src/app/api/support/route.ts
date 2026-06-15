import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { getAllTickets, getTicketStats } from '@/lib/support-tickets'

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as any

  try {
    const [tickets, stats] = await Promise.all([
      getAllTickets(status ? { status } : undefined),
      getTicketStats(),
    ])
    return Response.json({ tickets, stats })
  } catch (error) {
    console.error('[support] error:', error)
    return Response.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}
