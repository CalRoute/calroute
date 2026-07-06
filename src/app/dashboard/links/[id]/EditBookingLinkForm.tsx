'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DURATIONS = [15, 20, 30, 45, 60, 90]
type Tab = 'general' | 'routing' | 'emails' | 'integrations'

type TeamMember = {
  uid: string
  priority: number
  name: string
  email: string
  avatarUrl: string | null
}

export default function EditBookingLinkForm({
  link,
  initialHosts,
  ownerId,
  isTeam = false,
}: {
  link: any
  initialHosts: TeamMember[]
  ownerId: string
  isTeam?: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('general')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [form, setForm] = useState({
    title: link.title ?? '',
    teamName: link.teamName ?? '',
    description: link.description ?? '',
    slug: link.slug ?? '',
    durationMinutes: link.durationMinutes ?? 30,
    bufferAfterMinutes: link.bufferAfterMinutes ?? 0,
    routingStrategy: link.routingStrategy ?? 'priority',
    maxDaysAhead: link.maxDaysAhead ?? 30,
    meetingType: link.meetingType ?? 'google_meet',
    meetingLocation: link.meetingLocation ?? '',
    externalDataEnabled: link.externalDataEnabled ?? false,
    externalDataApiEndpoint: link.externalDataApiEndpoint ?? '',
    externalDataApiKey: link.externalDataApiKey ?? '',
    redirectUrlOnBooking: link.redirectUrlOnBooking ?? '',
    greeting: link.greeting ?? '',
  })
  const [showApiKey, setShowApiKey] = useState(false)

  // Email templates state
  const [emailTemplates, setEmailTemplates] = useState<Record<string, string>>({
    confirmed: link.emailTemplates?.confirmed ?? '',
    cancelled: link.emailTemplates?.cancelled ?? '',
    rescheduled: link.emailTemplates?.rescheduled ?? '',
  })
  const [emailTab, setEmailTab] = useState<'confirmed' | 'cancelled' | 'rescheduled'>('confirmed')

  // Team state
  const [hosts, setHosts] = useState<TeamMember[]>(initialHosts)
  const [addEmail, setAddEmail] = useState('')
  const [addPriority, setAddPriority] = useState(1)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removingUid, setRemovingUid] = useState<string | null>(null)

  // API test state
  const [testingApi, setTestingApi] = useState(false)
  const [apiTestResult, setApiTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (link.externalDataEnabled && link.externalDataApiEndpoint && link.externalDataApiKey) {
      setTestingApi(true)
      fetch('/api/external-data/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiEndpoint: link.externalDataApiEndpoint, apiKey: link.externalDataApiKey }),
      })
        .then(r => r.json().then(d => ({ ok: r.ok, d })))
        .then(({ ok, d }) => setApiTestResult({ status: ok ? 'success' : 'error', message: ok ? 'Connected ✓' : d.error || 'Test failed' }))
        .catch(() => setApiTestResult({ status: 'error', message: 'Connection failed' }))
        .finally(() => setTestingApi(false))
    }
  }, [])

  function slugify(val: string) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleTestApi() {
    setTestingApi(true)
    setApiTestResult(null)
    try {
      const res = await fetch('/api/external-data/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiEndpoint: form.externalDataApiEndpoint, apiKey: form.externalDataApiKey }),
      })
      const d = await res.json()
      setApiTestResult({ status: res.ok ? 'success' : 'error', message: res.ok ? 'Connected ✓' : d.error || 'Test failed' })
    } catch {
      setApiTestResult({ status: 'error', message: 'Connection failed' })
    } finally {
      setTestingApi(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaveSuccess(false)
    try {
      const res = await fetch(`/api/booking-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bufferBeforeMinutes: 0,
          emailTemplates: {
            confirmed: emailTemplates.confirmed || null,
            cancelled: emailTemplates.cancelled || null,
            rescheduled: emailTemplates.rescheduled || null,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update link')
      setSaveSuccess(true)
      setTimeout(() => router.push('/dashboard/links'), 1500)
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
      await fetch(`/api/booking-links/${link.id}`, { method: 'DELETE' })
      router.push('/dashboard/links')
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
      const res = await fetch(`/api/booking-links/${link.id}/hosts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!confirm('Remove this team member?')) return
    setRemovingUid(uid)
    try {
      const res = await fetch(`/api/booking-links/${link.id}/hosts/${uid}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      setHosts(prev => prev.filter(h => h.uid !== uid))
    } catch (err: any) {
      setAddError(err.message)
    } finally {
      setRemovingUid(null)
    }
  }

  async function handlePriorityChange(uid: string, priority: number) {
    setHosts(prev => prev.map(h => h.uid === uid ? { ...h, priority } : h))
    await fetch(`/api/booking-links/${link.id}/hosts/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    })
  }

  function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    ...(isTeam ? [{ id: 'routing' as Tab, label: 'Routing & Team' }] : []),
    { id: 'emails', label: 'Emails' },
    { id: 'integrations', label: 'Integrations' },
  ]

  return (
    <main className="min-h-screen bg-[#F7F4EF]">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-700">Dashboard</Link>
        <span className="text-gray-300">/</span>
        <Link href="/dashboard/links" className="text-gray-400 hover:text-gray-700">Links</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{link.title}</span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{link.title}</h1>
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/book/${link.slug}`}
              target="_blank" rel="noreferrer"
              className="text-sm text-[#0D7377] hover:underline mt-0.5 inline-block"
            >
              /book/{link.slug} ↗
            </a>
          </div>
          <button
            type="button" onClick={handleDelete} disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {deleting ? 'Deleting…' : 'Delete link'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setError(null); setSaveSuccess(false) }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
        {saveSuccess && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">✓ Saved successfully</div>}

        {/* ── Tab: General ── */}
        {tab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
              {/* Left: Basic info */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Basic info</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link title *</label>
                  <input
                    type="text" required value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. 30-min intro call"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                  />
                </div>
                {isTeam && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team name</label>
                    <input
                      type="text" value={form.teamName}
                      onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))}
                      placeholder="e.g. Sales Team"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Greeting message</label>
                  <textarea
                    rows={3} value={form.greeting}
                    onChange={e => setForm(f => ({ ...f, greeting: e.target.value }))}
                    placeholder="e.g. Hey! Looking forward to our chat. Feel free to share a bit about what you'd like to cover."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown to visitors at the top of your booking page.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking URL slug *</label>
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D7377]">
                    <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-300 whitespace-nowrap">/book/</span>
                    <input
                      type="text" required value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Duration & availability + Meeting type */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                  <h2 className="font-semibold text-gray-900">Duration & availability</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting duration</label>
                    <div className="flex flex-wrap gap-2">
                      {DURATIONS.map(d => (
                        <button key={d} type="button"
                          onClick={() => setForm(f => ({ ...f, durationMinutes: d }))}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            form.durationMinutes === d
                              ? 'bg-[#0D7377] text-white border-[#0D7377]'
                              : 'border-gray-300 text-gray-700 hover:border-[#0D7377]/40'
                          }`}
                        >{d} min</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buffer after meeting</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} max={60} value={form.bufferAfterMinutes}
                          onChange={e => setForm(f => ({ ...f, bufferAfterMinutes: Number(e.target.value) }))}
                          className="w-20 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                        />
                        <span className="text-sm text-gray-500">min</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max days ahead</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min={1} max={90} value={form.maxDaysAhead}
                          onChange={e => setForm(f => ({ ...f, maxDaysAhead: Number(e.target.value) }))}
                          className="w-20 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                        />
                        <span className="text-sm text-gray-500">days</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
                  <h2 className="font-semibold text-gray-900">Meeting type</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'google_meet', label: 'Google Meet', desc: 'Video link in calendar' },
                      { value: 'phone_call', label: 'Phone call', desc: 'Exchange phone numbers' },
                      { value: 'in_person', label: 'In person', desc: 'Provide a meeting address' },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setForm(f => ({ ...f, meetingType: opt.value as any }))}
                        className={`text-left p-4 rounded-xl border-2 transition-colors ${
                          form.meetingType === opt.value ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-sm text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  {form.meetingType === 'in_person' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meeting address</label>
                      <input
                        type="text"
                        value={form.meetingLocation}
                        onChange={e => setForm(f => ({ ...f, meetingLocation: e.target.value }))}
                        placeholder="123 Main St, New York, NY 10001"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || !form.title || !form.slug}
              className="w-full py-3 bg-[#0D7377] text-white rounded-xl font-semibold hover:bg-[#0a5f63] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        )}

        {/* ── Tab: Routing & Team ── */}
        {tab === 'routing' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
              <h2 className="font-semibold text-gray-900">Host routing</h2>
              <p className="text-sm text-gray-500">When multiple hosts are free, who gets assigned?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'priority', label: 'Priority', desc: 'Highest priority first' },
                  { value: 'round_robin', label: 'Round robin', desc: 'Booked longest ago' },
                  { value: 'smart', label: 'Smart', desc: 'Same timezone first' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(f => ({ ...f, routingStrategy: opt.value as any }))}
                    className={`text-left p-4 rounded-xl border-2 transition-colors ${
                      form.routingStrategy === opt.value ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#0D7377] text-white rounded-xl font-semibold hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save routing'}
            </button>

            {/* Team members — saves instantly, separate from form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-gray-900">Team members</h2>
                <p className="text-sm text-gray-500 mt-0.5">Members are added or removed immediately.</p>
              </div>

              <div className="space-y-1">
                {hosts.map(host => (
                  <div key={host.uid} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#0D7377]/10 text-[#0D7377] flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden">
                      {host.avatarUrl
                        ? <img src={host.avatarUrl} alt="" className="w-8 h-8 object-cover" />
                        : initials(host.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {host.name}
                        {host.uid === ownerId && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{host.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={host.priority}
                        onChange={e => handlePriorityChange(host.uid, Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                        title="Priority"
                      >
                        {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>P{p}</option>)}
                      </select>
                      {host.uid !== ownerId && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(host.uid)}
                          disabled={removingUid === host.uid}
                          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          {removingUid === host.uid ? '…' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddMember} className="space-y-2 pt-1">
                <p className="text-xs font-medium text-gray-700">Add team member</p>
                {addError && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{addError}</div>}
                <div className="flex gap-2">
                  <input
                    type="email" required placeholder="colleague@company.com"
                    value={addEmail} onChange={e => setAddEmail(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] min-w-0"
                  />
                  <select
                    value={addPriority} onChange={e => setAddPriority(Number(e.target.value))}
                    className="border border-gray-300 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                    title="Priority"
                  >
                    {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>P{p}</option>)}
                  </select>
                  <button type="submit" disabled={addLoading || !addEmail.trim()}
                    className="px-4 py-2 bg-[#0D7377] text-white rounded-xl text-sm font-medium hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
                  >
                    {addLoading ? '…' : 'Add'}
                  </button>
                </div>
                <p className="text-xs text-gray-400">They must already have a CalRoute account.</p>
              </form>
            </div>
          </form>
        )}

        {/* ── Tab: Emails ── */}
        {tab === 'emails' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-gray-900">Custom email templates</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Write your own HTML for each email type. Leave blank to use the default CalRoute template.
                </p>
              </div>

              {/* Email type picker */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                {([
                  { id: 'confirmed', label: 'Booking confirmed' },
                  { id: 'cancelled', label: 'Cancelled' },
                  { id: 'rescheduled', label: 'Rescheduled' },
                ] as const).map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmailTab(e.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      emailTab === e.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>

              {/* Available variables */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Available variables</p>
                <div className="flex flex-wrap gap-1.5">
                  {(emailTab === 'confirmed'
                    ? ['{{customerName}}', '{{hostName}}', '{{title}}', '{{startTime}}', '{{rescheduleUrl}}', '{{cancelUrl}}', '{{customerPhone}}']
                    : emailTab === 'cancelled'
                    ? ['{{customerName}}', '{{hostName}}', '{{title}}', '{{startTime}}']
                    : ['{{customerName}}', '{{hostName}}', '{{title}}', '{{newStartTime}}', '{{oldStartTime}}']
                  ).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setEmailTemplates(t => ({ ...t, [emailTab]: (t[emailTab] || '') + v }))}
                      className="font-mono text-[11px] bg-white border border-gray-200 text-[#0D7377] px-2 py-1 rounded-lg hover:bg-[#0D7377]/5 transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Click a variable to insert it, or type it directly in the editor.</p>
              </div>

              {/* Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">HTML template</label>
                  {emailTemplates[emailTab] && (
                    <button
                      type="button"
                      onClick={() => setEmailTemplates(t => ({ ...t, [emailTab]: '' }))}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Reset to default
                    </button>
                  )}
                </div>
                <textarea
                  value={emailTemplates[emailTab]}
                  onChange={e => setEmailTemplates(t => ({ ...t, [emailTab]: e.target.value }))}
                  placeholder={`<p>Hi {{customerName}},</p>\n<p>Your booking for <strong>{{title}}</strong> is confirmed.</p>`}
                  rows={12}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-y"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Plain HTML only. No <code className="bg-gray-100 px-1 rounded">&lt;script&gt;</code> tags.
                  Your HTML will be wrapped in CalRoute&apos;s standard email layout.
                </p>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#0D7377] text-white rounded-xl font-semibold hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save email templates'}
            </button>
          </form>
        )}

        {/* ── Tab: Integrations ── */}
        {tab === 'integrations' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* External data */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-gray-900">External user data</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fetch customer data from your system and pre-fill the booking form.</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-11 h-6 rounded-full transition-colors relative ${form.externalDataEnabled ? 'bg-[#0D7377]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.externalDataEnabled ? 'translate-x-5' : ''}`} />
                  <input
                    type="checkbox" className="sr-only"
                    checked={form.externalDataEnabled}
                    onChange={e => setForm(f => ({ ...f, externalDataEnabled: e.target.checked }))}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">Enable external data fetching</span>
              </label>

              {form.externalDataEnabled && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
                    <input
                      type="url" value={form.externalDataApiEndpoint}
                      onChange={e => { setForm(f => ({ ...f, externalDataApiEndpoint: e.target.value })); setApiTestResult(null) }}
                      placeholder="https://api.example.com/users/lookup"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                    />
                    <p className="text-xs text-gray-400 mt-1">Query parameters from the booking URL are forwarded to this endpoint.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Secret Key</label>
                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'} value={form.externalDataApiKey}
                        onChange={e => { setForm(f => ({ ...f, externalDataApiKey: e.target.value })); setApiTestResult(null) }}
                        placeholder="••••••••••••••••"
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                      />
                      <button type="button" onClick={() => setShowApiKey(!showApiKey)}
                        className="px-3 py-2 text-xs text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Sent as <span className="font-mono bg-gray-100 px-1 rounded">x-platform-key</span> header.</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button type="button" onClick={handleTestApi}
                      disabled={testingApi || !form.externalDataApiEndpoint || !form.externalDataApiKey}
                      className="px-4 py-2 text-sm font-medium text-[#0D7377] border border-[#0D7377] rounded-xl hover:bg-[#0D7377]/5 disabled:opacity-50 transition-colors"
                    >
                      {testingApi ? 'Testing…' : 'Test connection'}
                    </button>
                    {apiTestResult && (
                      <span className={`text-sm font-medium ${apiTestResult.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {apiTestResult.message}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Post-booking redirect */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-gray-900">Post-booking redirect</h2>
                <p className="text-sm text-gray-500 mt-0.5">Send customers to a specific page after they book.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL</label>
                <input
                  type="url" value={form.redirectUrlOnBooking}
                  onChange={e => setForm(f => ({ ...f, redirectUrlOnBooking: e.target.value }))}
                  placeholder="https://example.com/thank-you"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Customers are redirected with <span className="font-mono bg-gray-100 px-1 rounded">?booked=true</span> appended.
                </p>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#0D7377] text-white rounded-xl font-semibold hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save integrations'}
            </button>
          </form>
        )}

      </div>
    </main>
  )
}
