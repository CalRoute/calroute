'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DURATIONS = [15, 20, 30, 45, 60, 90]


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
}: {
  link: any
  initialHosts: TeamMember[]
  ownerId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    externalDataEnabled: link.externalDataEnabled ?? false,
    externalDataApiEndpoint: link.externalDataApiEndpoint ?? '',
    externalDataApiKey: link.externalDataApiKey ?? '',
  })
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  // Team state
  const [hosts, setHosts] = useState<TeamMember[]>(initialHosts)
  const [addEmail, setAddEmail] = useState('')
  const [addPriority, setAddPriority] = useState(1)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removingUid, setRemovingUid] = useState<string | null>(null)
  const [testingApi, setTestingApi] = useState(false)
  const [apiTestResult, setApiTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null)

  // Auto-test saved credentials on mount
  useEffect(() => {
    if (link.externalDataEnabled && link.externalDataApiEndpoint && link.externalDataApiKey && !apiTestResult) {
      const testCreds = async () => {
        setTestingApi(true)
        try {
          const res = await fetch('/api/external-data/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiEndpoint: link.externalDataApiEndpoint,
              apiKey: link.externalDataApiKey,
            }),
          })
          const data = await res.json()
          if (res.ok) {
            setApiTestResult({ status: 'success', message: 'API credentials verified ✓' })
          } else {
            setApiTestResult({ status: 'error', message: data.error || 'API test failed' })
          }
        } catch (err) {
          setApiTestResult({ status: 'error', message: 'Connection failed' })
        } finally {
          setTestingApi(false)
        }
      }
      testCreds()
    }
  }, [])

  function slugify(val: string) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleTestApi() {
    if (!form.externalDataApiEndpoint || !form.externalDataApiKey) {
      setApiTestResult({ status: 'error', message: 'API endpoint and key are required' })
      return
    }

    setTestingApi(true)
    setApiTestResult(null)

    try {
      const res = await fetch('/api/external-data/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiEndpoint: form.externalDataApiEndpoint,
          apiKey: form.externalDataApiKey,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setApiTestResult({ status: 'success', message: 'API credentials verified ✓' })
      } else {
        setApiTestResult({ status: 'error', message: data.error || 'API test failed' })
      }
    } catch (err) {
      setApiTestResult({ status: 'error', message: err instanceof Error ? err.message : 'Connection failed' })
    } finally {
      setTestingApi(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/booking-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, bufferBeforeMinutes: 0 }),
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
      await fetch(`/api/booking-links/${link.id}`, { method: 'DELETE' })
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
    if (!confirm('Remove this team member from this booking link?')) return
    setRemovingUid(uid)
    try {
      const res = await fetch(`/api/booking-links/${link.id}/hosts/${uid}`, { method: 'DELETE' })
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
      await fetch(`/api/booking-links/${link.id}/hosts/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Team name</label>
              <input
                type="text" value={form.teamName}
                onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))}
                placeholder="e.g. Sales Team, Support Team"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Shown to team members on their dashboard.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking link title *</label>
              <input
                type="text" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. 30-min intro call"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Shown to customers on the booking page.</p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buffer between meetings (min)</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={60} value={form.bufferAfterMinutes}
                  onChange={e => setForm(f => ({ ...f, bufferAfterMinutes: Number(e.target.value) }))}
                  className="w-24 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">min gap after each meeting</span>
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

          {/* Meeting type */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Meeting type</h2>
            <p className="text-sm text-gray-500">How will meetings with customers take place?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'google_meet', label: 'Google Meet', desc: 'Video conference link in calendar' },
                { value: 'phone_call', label: 'Phone Call', desc: 'Exchange phone numbers' },
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
          </div>

          {/* External Data */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">External user data</h2>
              <p className="text-sm text-gray-500 mt-0.5">Automatically fetch and pre-fill user information from your external systems</p>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Enable external data fetching</p>
                <p className="text-xs text-gray-500 mt-1">
                  Visit with ?email=user@example.com&pdCode=ABC123 to pre-fill the form
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={form.externalDataEnabled}
                  onChange={e => setForm(f => ({ ...f, externalDataEnabled: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-[#0D7377] focus:ring-[#0D7377]"
                />
                <span className="text-sm font-medium text-gray-700">Enable</span>
              </label>
            </div>

            {form.externalDataEnabled && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {/* Status badge if config exists */}
                {link.externalDataApiEndpoint && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Configuration</p>
                      <p className="text-xs text-gray-500 mt-0.5">{link.externalDataApiEndpoint}</p>
                    </div>
                    {apiTestResult && (
                      <div className={`text-xs font-medium px-2 py-1 rounded ${
                        apiTestResult.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiTestResult.status === 'success' ? '✓ Valid' : '✗ Invalid'}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">API Endpoint</label>
                  <input
                    type="url"
                    value={form.externalDataApiEndpoint}
                    onChange={e => {
                      setForm(f => ({ ...f, externalDataApiEndpoint: e.target.value }))
                      setApiTestResult(null)
                    }}
                    placeholder="https://api.example.com/users/lookup"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">Called with your URL query parameters appended</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">API Secret Key</label>
                  <div className="flex gap-2">
                    <input
                      type={showApiKeyInput ? 'text' : 'password'}
                      value={form.externalDataApiKey}
                      onChange={e => {
                        setForm(f => ({ ...f, externalDataApiKey: e.target.value }))
                        setApiTestResult(null)
                      }}
                      placeholder="••••••••••••••••"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
                    >
                      {showApiKeyInput ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Sent as: x-platform-key header</p>
                </div>

                <button
                  type="button"
                  onClick={handleTestApi}
                  disabled={testingApi || !form.externalDataApiEndpoint || !form.externalDataApiKey}
                  className="w-full px-4 py-2 bg-white text-[#0D7377] border border-[#0D7377] rounded-lg hover:bg-[#0D7377]/5 disabled:opacity-50 font-medium text-sm transition-colors"
                >
                  {testingApi ? 'Testing...' : 'Test API Credentials'}
                </button>

                {apiTestResult && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                    apiTestResult.status === 'success'
                      ? 'bg-green-100 border border-green-300 text-green-800'
                      : 'bg-red-100 border border-red-300 text-red-800'
                  }`}>
                    <span className="text-lg">{apiTestResult.status === 'success' ? '✓' : '✗'}</span>
                    {apiTestResult.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Routing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Host routing</h2>
            <p className="text-sm text-gray-500">When multiple hosts are free at the same time, who gets assigned?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'priority', label: 'Priority', desc: 'Highest-priority host first' },
                { value: 'round_robin', label: 'Round robin', desc: 'Whoever was booked longest ago' },
                { value: 'smart', label: 'Smart', desc: 'Same timezone as guest, then priority' },
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
              They must have a CalRoute account. Each member sets their own hours in their{' '}
              <a href="/dashboard/settings" className="underline hover:text-gray-600">Settings</a>.
            </p>
          </form>
        </div>

      </div>
    </main>
  )
}
