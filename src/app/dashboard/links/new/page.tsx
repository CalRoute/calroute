'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DURATIONS = [15, 20, 30, 45, 60, 90]

export default function NewBookingLinkPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    teamName: '',
    description: '',
    slug: '',
    durationMinutes: 30,
    bufferAfterMinutes: 0,
    routingStrategy: 'priority' as 'priority' | 'round_robin',
    maxDaysAhead: 30,
  })

  function slugify(val: string) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    setForm(f => ({
      ...f,
      title,
      slug: f.slug === slugify(f.title) || f.slug === '' ? slugify(title) : f.slug,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/booking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, bufferBeforeMinutes: 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create link')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F4EF]">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          ← Dashboard
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">New booking link</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Basic info</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team name</label>
              <input
                type="text" value={form.teamName}
                onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))}
                placeholder="e.g. Sales Team, Support Team"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              />
              <p className="text-xs text-gray-400 mt-1">Shown to team members on their dashboard.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking link title *</label>
              <input
                type="text" required value={form.title} onChange={handleTitleChange}
                placeholder="e.g. 30-min intro call"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              />
              <p className="text-xs text-gray-400 mt-1">Shown to customers on the booking page.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What is this meeting about?"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link slug * <span className="text-gray-400 font-normal ml-1">— your booking URL</span>
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0D7377]">
                <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-300 whitespace-nowrap">/book/</span>
                <input
                  type="text" required value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="intro-call"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Duration & buffers */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Duration & buffers</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting duration</label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map(d => (
                  <button key={d} type="button" onClick={() => setForm(f => ({ ...f, durationMinutes: d }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      form.durationMinutes === d ? 'bg-[#0D7377] text-white border-[#0D7377]' : 'border-gray-300 text-gray-700 hover:border-[#0D7377]'
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
                  className="w-24 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                />
                <span className="text-sm text-gray-500">min gap after each meeting</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How far ahead can customers book?</label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={90} value={form.maxDaysAhead}
                  onChange={e => setForm(f => ({ ...f, maxDaysAhead: Number(e.target.value) }))}
                  className="w-24 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                />
                <span className="text-sm text-gray-500">days ahead</span>
              </div>
            </div>
          </div>

          {/* Routing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Host routing</h2>
            <p className="text-sm text-gray-500">When multiple hosts are free at the same time, who gets assigned?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'priority', label: 'Priority', desc: 'Always assign the highest-priority host first' },
                { value: 'round_robin', label: 'Round robin', desc: 'Distribute evenly — whoever was booked longest ago goes next' },
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

          <p className="text-xs text-gray-400 text-center">
            Set your availability in <Link href="/dashboard/settings" className="underline hover:text-gray-600">Settings</Link> — it applies to all your booking links.
          </p>

          <button type="submit" disabled={loading || !form.title || !form.slug}
            className="w-full py-3 bg-[#0D7377] text-white rounded-xl font-medium hover:bg-[#0a5f63] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating…' : 'Create booking link'}
          </button>
        </form>
      </div>
    </main>
  )
}
