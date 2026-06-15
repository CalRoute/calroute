'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useToast } from '@/components/Toast'

interface Webhook {
  id: string
  url: string
  events: string[]
  secret?: string
  isActive: boolean
  createdAt: string
}

interface Props {
  webhooks: Webhook[]
  isFree: boolean
}

const EVENT_OPTIONS = [
  { value: 'booking.confirmed', label: 'Booking Confirmed' },
  { value: 'booking.cancelled', label: 'Booking Cancelled' },
  { value: 'booking.rescheduled', label: 'Booking Rescheduled' },
]

export default function WebhooksManager({ webhooks: initialWebhooks, isFree }: Props) {
  const { showToast } = useToast()
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const [showDialog, setShowDialog] = useState(false)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['booking.confirmed'])
  const [loading, setLoading] = useState(false)
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null)
  const [newWebhookId, setNewWebhookId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      showToast('URL is required', 'error')
      return
    }
    if (selectedEvents.length === 0) {
      showToast('Select at least one event', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/hosts/me/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events: selectedEvents }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to create webhook', 'error')
        return
      }

      const data = await res.json()
      setGeneratedSecret(data.secret)
      setNewWebhookId(data.id)
      setWebhooks([...webhooks, { id: data.id, url, events: selectedEvents, isActive: true, createdAt: new Date().toISOString() }])
      setUrl('')
      setSelectedEvents(['booking.confirmed'])
    } catch (error) {
      showToast('Error creating webhook', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    setToggling(id)
    try {
      const res = await fetch(`/api/hosts/me/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!res.ok) {
        showToast('Failed to update webhook', 'error')
        return
      }

      setWebhooks(webhooks.map(w => w.id === id ? { ...w, isActive: !isActive } : w))
    } catch (error) {
      showToast('Error updating webhook', 'error')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this webhook?')) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/hosts/me/webhooks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Failed to delete webhook', 'error')
        return
      }
      setWebhooks(webhooks.filter(w => w.id !== id))
      showToast('Webhook deleted', 'success')
    } catch (error) {
      showToast('Error deleting webhook', 'error')
    } finally {
      setDeleting(null)
    }
  }

  if (isFree) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#0D7377]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900">Webhooks</h2>
            <p className="text-sm text-gray-500 mt-0.5 mb-3">Available on the Solo and Team plans. Get real-time booking events sent to your own systems.</p>
            <a
              href="/dashboard/settings?tab=billing"
              className="inline-flex items-center gap-1.5 bg-[#0D7377] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0a5f63] transition-colors"
            >
              Upgrade to Solo →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Webhooks</h2>
          <p className="text-sm text-gray-600 mt-1">Receive real-time notifications when bookings happen</p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="px-4 py-2.5 bg-[#0D7377] text-white text-sm font-medium rounded-xl hover:bg-[#0a5f63] transition-colors whitespace-nowrap"
        >
          + Create webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600">No webhooks yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{webhook.url}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {webhook.events.map(event => (
                    <span key={event} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {EVENT_OPTIONS.find(o => o.value === event)?.label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Created {format(parseISO(webhook.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(webhook.id, webhook.isActive)}
                  disabled={toggling === webhook.id}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    webhook.isActive
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {webhook.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleDelete(webhook.id)}
                  disabled={deleting === webhook.id}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Webhook Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 max-h-96 overflow-y-auto">
            {generatedSecret ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Webhook created!</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700 mb-2 font-semibold">Webhook Secret (shown only once):</p>
                  <code className="text-xs font-mono text-blue-900 break-all block">{generatedSecret}</code>
                </div>
                <p className="text-xs text-gray-600">
                  Save this secret safely. Use it to verify webhook requests by checking the X-CalRoute-Signature header.
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedSecret)
                    showToast('Secret copied', 'success')
                    setShowDialog(false)
                    setGeneratedSecret(null)
                  }}
                  className="w-full bg-[#0D7377] text-white font-medium py-2.5 rounded-lg hover:bg-[#0a5f63] transition-colors"
                >
                  Copy and close
                </button>
              </>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create webhook</h3>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Webhook URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/webhooks/calroute"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Events</label>
                  <div className="space-y-2">
                    {EVENT_OPTIONS.map(option => (
                      <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEvents([...selectedEvents, option.value])
                            } else {
                              setSelectedEvents(selectedEvents.filter(v => v !== option.value))
                            }
                          }}
                          className="rounded w-4 h-4"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDialog(false)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-[#0D7377] hover:bg-[#0a5f63] rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
