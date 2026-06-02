import { adminDb } from './firebase/admin'

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface SupportTicket {
  id: string
  userId: string
  userEmail: string
  userName: string
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  assignedTo?: string
  category: 'bug' | 'feature-request' | 'billing' | 'technical' | 'other'
  notes: Array<{ text: string; author: string; timestamp: string }>
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export async function createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'notes' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await adminDb.collection('support_tickets').add({
      ...ticket,
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return docRef.id
  } catch (error) {
    console.error('[tickets] error creating ticket:', error)
    return null
  }
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  try {
    await adminDb.collection('support_tickets').doc(ticketId).update({
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'resolved' && { resolvedAt: new Date().toISOString() }),
    })
    return true
  } catch (error) {
    console.error('[tickets] error updating status:', error)
    return false
  }
}

export async function assignTicket(ticketId: string, assignedTo: string) {
  try {
    await adminDb.collection('support_tickets').doc(ticketId).update({
      assignedTo,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('[tickets] error assigning ticket:', error)
    return false
  }
}

export async function addTicketNote(ticketId: string, note: string, author: string) {
  try {
    const ticketRef = adminDb.collection('support_tickets').doc(ticketId)
    const ticketSnap = await ticketRef.get()

    if (!ticketSnap.exists) {
      return false
    }

    const ticketData = ticketSnap.data() as SupportTicket
    const newNote = {
      text: note,
      author,
      timestamp: new Date().toISOString(),
    }

    await ticketRef.update({
      notes: [...(ticketData.notes || []), newNote],
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('[tickets] error adding note:', error)
    return false
  }
}

export async function getAllTickets(filter?: { status?: TicketStatus; assignedTo?: string }) {
  try {
    let query: any = adminDb.collection('support_tickets')

    if (filter?.status) {
      query = query.where('status', '==', filter.status)
    }
    if (filter?.assignedTo) {
      query = query.where('assignedTo', '==', filter.assignedTo)
    }

    const snap = await query.orderBy('createdAt', 'desc').limit(100).get()

    return snap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as (SupportTicket & { id: string })[]
  } catch (error) {
    console.error('[tickets] error getting tickets:', error)
    return []
  }
}

export async function getTicketStats() {
  try {
    const snap = await adminDb.collection('support_tickets').get()
    const tickets = snap.docs.map(d => d.data() as SupportTicket)

    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      byPriority: {
        urgent: tickets.filter(t => t.priority === 'urgent').length,
        high: tickets.filter(t => t.priority === 'high').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        low: tickets.filter(t => t.priority === 'low').length,
      },
      avgResolutionTime: calculateAvgResolutionTime(tickets),
    }
  } catch (error) {
    console.error('[tickets] error getting stats:', error)
    return null
  }
}

function calculateAvgResolutionTime(tickets: SupportTicket[]): number {
  const resolved = tickets.filter(t => t.resolvedAt && t.status === 'resolved')
  if (resolved.length === 0) return 0

  const times = resolved.map(t => {
    const created = new Date(t.createdAt)
    const resolved = new Date(t.resolvedAt!)
    return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60) // hours
  })

  return Math.round(times.reduce((a, b) => a + b, 0) / times.length)
}
