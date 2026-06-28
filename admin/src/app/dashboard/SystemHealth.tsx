'use client'

import { useState, useEffect } from 'react'

interface HealthData {
  webhooks: { totalWebhooks: number; failedWebhooks: number; failureRate: string }
  email: { total: number; failed: number; deliveryRate: number | null }
  tokens: { expiredCount: number; totalUsers: number }
  lastBooking: string | null
  noCalendarUsers: number
  totalUsers: number
}

export default function SystemHealth() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/system-health-stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">Loading system health…</p>
    </div>
  )

  if (!data) return null

  const { webhooks, email, tokens, lastBooking, noCalendarUsers, totalUsers } = data

  const lastBookingText = lastBooking
    ? (() => {
        const diff = Math.round((Date.now() - new Date(lastBooking).getTime()) / 60000)
        if (diff < 60) return `${diff}m ago`
        if (diff < 1440) return `${Math.round(diff / 60)}h ago`
        return `${Math.round(diff / 1440)}d ago`
      })()
    : 'No bookings yet'

  const webhookStatus = webhooks.totalWebhooks === 0
    ? { label: 'No webhooks configured', color: 'text-gray-500', dot: 'bg-gray-300' }
    : webhooks.failedWebhooks === 0
      ? { label: `${webhooks.totalWebhooks} configured · no failures`, color: 'text-green-700', dot: 'bg-green-500' }
      : { label: `${webhooks.failedWebhooks} failed of ${webhooks.totalWebhooks}`, color: 'text-red-700', dot: 'bg-red-500' }

  const emailStatus = email.deliveryRate === null
    ? { label: 'No emails sent yet', color: 'text-gray-500', dot: 'bg-gray-300' }
    : email.deliveryRate === 100
      ? { label: `100% delivery · ${email.total} sent (24h)`, color: 'text-green-700', dot: 'bg-green-500' }
      : { label: `${email.deliveryRate}% delivery · ${email.failed} failed (24h)`, color: 'text-red-700', dot: 'bg-red-500' }

  const tokenStatus = tokens.expiredCount === 0
    ? { label: `All ${totalUsers} users connected`, color: 'text-green-700', dot: 'bg-green-500' }
    : { label: `${tokens.expiredCount} user${tokens.expiredCount !== 1 ? 's' : ''} with expired token`, color: 'text-red-700', dot: 'bg-red-500' }

  const calStatus = noCalendarUsers === 0
    ? { label: 'All users have a calendar connected', color: 'text-green-700', dot: 'bg-green-500' }
    : { label: `${noCalendarUsers} user${noCalendarUsers !== 1 ? 's' : ''} with no calendar`, color: 'text-amber-700', dot: 'bg-amber-400' }

  const rows = [
    { label: 'Webhooks', value: webhookStatus.label, color: webhookStatus.color, dot: webhookStatus.dot },
    { label: 'Email delivery (24h)', value: emailStatus.label, color: emailStatus.color, dot: emailStatus.dot },
    { label: 'Calendar tokens', value: tokenStatus.label, color: tokenStatus.color, dot: tokenStatus.dot },
    { label: 'Calendar connections', value: calStatus.label, color: calStatus.color, dot: calStatus.dot },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Last booking: <span className="font-medium text-gray-700">{lastBookingText}</span>
        </p>
      </div>

      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.label} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${row.dot}`} />
            <span className="text-sm text-gray-600 w-44 flex-shrink-0">{row.label}</span>
            <span className={`text-sm font-medium ${row.color}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
