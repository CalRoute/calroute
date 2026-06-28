'use client'

import { useState, useEffect } from 'react'

interface Ticket {
  id: string
  number: number
  subject: string
  description: string
  status: 'open' | 'resolved'
  priority: string
  category: string
  assignedTo: string | null
  createdAt: string
  githubUrl: string
  author: string
}

interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  avgResolutionTime: number
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-700',
}

export default function SupportQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ title: '', body: '', priority: 'medium', category: 'bug' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/support${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTickets(data.tickets || [])
      setStats(data.stats)
    } catch {
      setError('Failed to load issues from GitHub. Make sure GITHUB_TOKEN is set.')
    } finally {
      setLoading(false)
    }
  }

  const updateTicket = async (id: string, updates: any) => {
    setUpdatingId(id)
    try {
      await fetch(`/api/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      await load()
    } finally {
      setUpdatingId(null)
    }
  }

  const createIssue = async () => {
    if (!newForm.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setShowNew(false)
      setNewForm({ title: '', body: '', priority: 'medium', category: 'bug' })
      window.open(data.url, '_blank')
      await load()
    } catch {
      setError('Failed to create issue.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Open', value: stats.open, color: 'text-red-600' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600' },
            { label: 'Avg Resolution', value: `${stats.avgResolutionTime}h`, color: 'text-gray-900' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">GitHub Issues</h2>
            <a
              href="https://github.com/CalRoute/calroute/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0D7377] hover:underline"
            >
              View on GitHub ↗
            </a>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="resolved">Closed</option>
            </select>
            <button
              onClick={() => setShowNew(v => !v)}
              className="px-3 py-2 text-sm font-medium bg-[#0D7377] text-white rounded-lg hover:bg-[#0a5f63] transition-colors"
            >
              + New issue
            </button>
          </div>
        </div>

        {/* New issue form */}
        {showNew && (
          <div className="mb-5 p-4 border border-[#0D7377]/30 bg-[#0D7377]/5 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Create GitHub issue</h3>
            <input
              type="text"
              placeholder="Title *"
              value={newForm.title}
              onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
            />
            <textarea
              placeholder="Description (optional)"
              value={newForm.body}
              onChange={e => setNewForm(f => ({ ...f, body: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-none"
            />
            <div className="flex gap-3">
              <select
                value={newForm.priority}
                onChange={e => setNewForm(f => ({ ...f, priority: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <select
                value={newForm.category}
                onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              >
                <option value="bug">Bug</option>
                <option value="feature-request">Feature request</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createIssue}
                disabled={creating || !newForm.title.trim()}
                className="px-4 py-2 text-sm font-medium bg-[#0D7377] text-white rounded-lg hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating…' : 'Create issue'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-center py-8 text-gray-500">Loading issues…</p>
        ) : tickets.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No issues found</p>
        ) : (
          <div className="space-y-2">
            {tickets.map(ticket => (
              <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg space-y-2 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">#{ticket.number}</span>
                      <a
                        href={ticket.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-[#0D7377] hover:underline break-words"
                      >
                        {ticket.subject}
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">opened by {ticket.author} · {new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ticket.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {ticket.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_COLORS[ticket.priority] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                {ticket.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={ticket.status}
                    onChange={e => updateTicket(ticket.id, { status: e.target.value })}
                    disabled={updatingId === ticket.id}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#0D7377] disabled:opacity-50"
                  >
                    <option value="open">Open</option>
                    <option value="resolved">Resolved (close)</option>
                  </select>
                  <span className="text-xs text-gray-400 ml-auto">{ticket.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
