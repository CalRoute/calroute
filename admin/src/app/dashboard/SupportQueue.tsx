'use client'

import { useState, useEffect } from 'react'

interface SupportTicket {
  id: string
  userId: string
  userEmail: string
  userName: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  assignedTo?: string
  category: string
  createdAt: string
  updatedAt: string
}

interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  byPriority: Record<string, number>
  avgResolutionTime: number
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-700',
}

export default function SupportQueue() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadTickets()
  }, [filter])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/support${params}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to load tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateTicket = async (ticketId: string, updates: any) => {
    setUpdatingId(ticketId)
    try {
      const res = await fetch(`/api/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        await loadTickets()
      }
    } catch (err) {
      console.error('Failed to update ticket:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading support tickets...</div>
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Open</p>
            <p className="text-2xl font-bold text-red-600">{stats.open}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Avg Resolution</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgResolutionTime}h</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Support Tickets</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="space-y-2">
          {tickets.map(ticket => (
            <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg space-y-3 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 break-words">{ticket.subject}</h3>
                  <p className="text-xs text-gray-600 mt-1">{ticket.userName} ({ticket.userEmail})</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[ticket.status]}`}>
                    {ticket.status.replace('-', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${PRIORITY_COLORS[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <select
                  value={ticket.status}
                  onChange={(e) => updateTicket(ticket.id, { status: e.target.value })}
                  disabled={updatingId === ticket.id}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0D7377] disabled:opacity-50"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={ticket.assignedTo || 'unassigned'}
                  onChange={(e) =>
                    updateTicket(ticket.id, {
                      assignedTo: e.target.value === 'unassigned' ? undefined : e.target.value,
                    })
                  }
                  disabled={updatingId === ticket.id}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0D7377] disabled:opacity-50"
                >
                  <option value="unassigned">Unassigned</option>
                  <option value="support">Support Team</option>
                  <option value="engineering">Engineering</option>
                </select>

                <p className="text-xs text-gray-500 ml-auto">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {tickets.length === 0 && (
          <p className="text-center py-8 text-gray-500">No tickets found</p>
        )}
      </div>
    </div>
  )
}
