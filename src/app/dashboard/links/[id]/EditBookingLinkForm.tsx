'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClientToken } from '@/lib/firebase/getClientToken'
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

type TeamMember = {
  uid: string
  priority: number
  name: string
  email: string
  avatarUrl: string | null
}

export default function EditBookingLinkForm({
  link,
  savedAvailability,
  initialHosts,
  ownerId,
}: {
  link: any
  savedAvailability: any[]
  initialHosts: TeamMember[]
  ownerId: string
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

  // Team state
  const [hosts, setHosts] = useState<TeamMember[]>(initialHosts)
  const [addEmail, setAddEmail] = useState('')
  const [addPriority, setAddPriority] = useState(1)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removingUid, setRemovingUid] = useState<string | null>(null)

  function slugify(val: string) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function updateAvailability(index: number, field: string, value: any) {
    setAvailability(prev => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const idToken = await getClientToken()
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
      const idToken = await getClientToken()
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

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    setAddError(null)
    try {
      const idToken = await getClientToken()
      const res = await fetch(`/api/booking-links/${link.id}/hosts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ email: addEmail.trim(), priority: addPriority }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add member')
      setHosts(prev => [...prev, data])
      setAddEmail('')
      setAddPriority(1)
    } catch (err: any) {
      setAddError(err.message)
    } finally {
      setAddLoading(false)
    }
  }

  async function handleRemoveMember(uid: string) {
    if (!confirm('Remove this team member from this booking link?')) return
    setRemovingUid(uid)
    try {
      const idToken = await getClientToken()
      const res = await fetch(`/api/booking-links/${link.id}/hosts/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (!res.ok) throw new Error('Failed to remove member')
      setHosts(prev => prev.filter(h => h.uid !== uid))
    } catch (err: any) {
      setAddError(err.message)
    } finally {
      setRemovingUid(null)
    }
  }

  async function handlePriorityChange(uid: string, priority: number) {
    setHosts(prev => prev.map(h => h.uid === uid ? { ...h, priority } : h))
    try {
      const idToken = await getClientToken()
      await fetch(`/api/booking-links/${link.id}/hosts/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ priority }),
      })
    } catch {
      // silently revert on failure
      setHosts(prev => prev.map(h => h.uid === uid ? { ...h, priority: hosts.find(x => x.uid === uid)?.priority ?? priority } : h))
    }
  }

  function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
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

        {/* Team members — outside the form, saves immediately */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Team members</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Bookings are routed to available team members based on the strategy above.
            </p>
          </div>

          {/* Current members */}
          <div className="space-y-2">
            {hosts.map(host => (
              <div key={host.uid} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {host.avatarUrl
                    ? <img src={host.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                    : initials(host.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {host.name}
                    {host.uid === ownerId && <span className="ml-1.5 text-xs text-gray-400 font-normal">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{host.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label className="text-xs text-gray-500 hidden sm:block">Priority</label>
                  <select
                    value={host.priority}
                    onChange={e => handlePriorityChange(host.uid, Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {host.uid !== ownerId && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(host.uid)}
                      disabled={removingUid === host.uid}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 px-1"
                    >
                      {removingUid === host.uid ? '…' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add member form */}
          <form onSubmit={handleAddMember} className="pt-1 space-y-3">
            <p className="text-xs font-medium text-gray-700">Add a team member</p>
            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{addError}</div>
            )}
            <div className="flex gap-2">
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
              />
              <select
                value={addPriority}
                onChange={e => setAddPriority(Number(e.target.value))}
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                title="Priority"
              >
                {[1, 2, 3, 4, 5].map(p => (
                  <option key={p} value={p}>P{p}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={addLoading || !addEmail.trim()}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                {addLoading ? 'Adding…' : 'Add'}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              They must have a CalRoute account. Their availability and calendar will be included in routing.
            </p>
          </form>
        </div>

      </div>
    </main>
  )
}
