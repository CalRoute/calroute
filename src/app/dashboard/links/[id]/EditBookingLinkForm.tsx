'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/client'
import Link from 'next/link'

const DURATIONS = [15, 20, 30, 45, 60, 90]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DEFAULT_AVAILABILITY = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', enabled: false },
  { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', enabled: false },
]

function mergeAvailability(saved: any[]) {
  return DEFAULT_AVAILABILITY.map(def => {
    const found = saved.find((s: any) => s.dayOfWeek === def.dayOfWeek)
    return found ? { ...found, enabled: true } : def
  })
}

export default function EditBookingLinkForm({
  link,
  savedAvailability,
}: {
  link: any
  savedAvailability: any[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: link.title ?? '',
    description: link.description ?? '',
    slug: link.slug ?? '',
    durationMinutes: link.durationMinutes ?? 30,
    bufferBeforeMinutes: link.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: link.bufferAfterMinutes ?? 0,
    routingStrategy: link.routingStrategy ?? 'priority',
    maxDaysAhead: link.maxDaysAhead ?? 30,
  })

  const [availability, setAvailability] = useState(mergeAvailability(savedAvailability))

  function slugify(val: string) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function updateAvailability(index: number, field: string, value: any) {
    setAvailability(prev => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  async function getToken() {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    return user.getIdToken()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const idToken = await getToken()
      const res = await fetch(`/api/booking-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          ...form,
          availability: availability.filter(a => a.enabled),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update link')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${link.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const idToken = await getToken()
      await fetch(`/api/booking-links/${link.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      router.push('/dashboard')
    } catch {
      setError('Failed to delete link')
      setDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Dashboard
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">Edit booking link</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Basic info</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link slug * <span className="text-gray-400 font-normal">— your booking URL</span>
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-300 whitespace-nowrap">/book/</span>
                <input
                  type="text" required value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Duration & buffers */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Duration & buffers</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting duration</label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map(d => (
                  <button key={d} type="button"
                    onClick={() => setForm(f => ({ ...f, durationMinutes: d }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      form.durationMinutes === d ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:border-blue-400'
                    }`}
                  >{d} min</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buffer before (min)</label>
                <input type="number" min={0} max={60} value={form.bufferBeforeMinutes}
                  onChange={e => setForm(f => ({ ...f, bufferBeforeMinutes: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buffer after (min)</label>
                <input type="number" min={0} max={60} value={form.bufferAfterMinutes}
                  onChange={e => setForm(f => ({ ...f, bufferAfterMinutes: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How far ahead can customers book?</label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={90} value={form.maxDaysAhead}
                  onChange={e => setForm(f => ({ ...f, maxDaysAhead: Number(e.target.value) }))}
                  className="w-24 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">days ahead</span>
              </div>
            </div>
          </div>

          {/* Routing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Host routing</h2>
            <p className="text-sm text-gray-500">When multiple hosts are free at the same time, who gets assigned?</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'priority', label: 'Priority', desc: 'Always assign the highest-priority host first' },
                { value: 'round_robin', label: 'Round robin', desc: 'Distribute evenly — whoever was booked longest ago goes next' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(f => ({ ...f, routingStrategy: opt.value as any }))}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${
                    form.routingStrategy === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Your availability</h2>
            <p className="text-sm text-gray-500">Set the hours customers can book with you.</p>
            <div className="space-y-2">
              {availability.map((a, i) => (
                <div key={a.dayOfWeek} className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => updateAvailability(i, 'enabled', !a.enabled)}
                    className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${a.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full shadow mx-auto transition-transform ${a.enabled ? 'translate-x-2' : '-translate-x-2'}`} />
                  </button>
                  <span className={`w-8 text-sm font-medium ${a.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    {DAYS[a.dayOfWeek]}
                  </span>
                  {a.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={a.startTime}
                        onChange={e => updateAvailability(i, 'startTime', e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <input type="time" value={a.endTime}
                        onChange={e => updateAvailability(i, 'endTime', e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading || !form.title || !form.slug}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="px-6 py-3 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}
