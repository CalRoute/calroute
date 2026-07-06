'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DURATIONS = [15, 20, 30, 45, 60, 90]

type SlugStatus = null | 'checking' | 'available' | 'taken'

export default function PersonalLinkPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>(null)
  const [slugAlternatives, setSlugAlternatives] = useState<string[]>([])
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    durationMinutes: 30,
    meetingType: 'google_meet' as 'google_meet' | 'phone_call' | 'in_person',
    meetingLocation: '',
  })

  function slugify(val: string) {
    return val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    const newSlug = slugify(title)
    const shouldAutoFormat = form.slug === slugify(form.title) || form.slug === ''

    if (shouldAutoFormat) {
      setForm(f => ({ ...f, title, slug: newSlug }))

      // Check availability of auto-formatted slug
      if (checkTimeout) clearTimeout(checkTimeout)
      if (!newSlug) {
        setSlugStatus(null)
        setSlugAlternatives([])
        return
      }

      setSlugStatus('checking')
      const timeout = setTimeout(() => {
        fetch(`/api/booking-links/check-slug?slug=${encodeURIComponent(newSlug)}`)
          .then(r => r.json())
          .then(data => {
            if (data.available) {
              setSlugStatus('available')
              setSlugAlternatives([])
            } else {
              if (data.alternatives && data.alternatives.length > 0) {
                const autoSlug = data.alternatives[0]
                setForm(f => ({ ...f, slug: autoSlug }))
                setSlugStatus('available')
                setSlugAlternatives([])
              } else {
                setSlugStatus('taken')
                setSlugAlternatives([])
              }
            }
          })
          .catch(() => {
            setSlugStatus('taken')
          })
      }, 500)
      setCheckTimeout(timeout)
    } else {
      setForm(f => ({ ...f, title }))
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newSlug = slugify(e.target.value)
    setForm(f => ({ ...f, slug: newSlug }))

    if (checkTimeout) clearTimeout(checkTimeout)

    if (!newSlug) {
      setSlugStatus(null)
      setSlugAlternatives([])
      return
    }

    setSlugStatus('checking')

    const timeout = setTimeout(() => {
      fetch(`/api/booking-links/check-slug?slug=${encodeURIComponent(newSlug)}`)
        .then(r => r.json())
        .then(data => {
          if (data.available) {
            setSlugStatus('available')
            setSlugAlternatives([])
          } else {
            // Auto-use first alternative if slug is taken
            if (data.alternatives && data.alternatives.length > 0) {
              const autoSlug = data.alternatives[0]
              setForm(f => ({ ...f, slug: autoSlug }))
              setSlugStatus('available')
              setSlugAlternatives([])
            } else {
              setSlugStatus('taken')
              setSlugAlternatives([])
            }
          }
        })
        .catch(() => {
          setSlugStatus('taken')
        })
    }, 500)

    setCheckTimeout(timeout)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/booking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          durationMinutes: form.durationMinutes,
          meetingType: form.meetingType,
          meetingLocation: form.meetingLocation || null,
          teamName: '',
          description: '',
          bufferAfterMinutes: 0,
          routingStrategy: 'priority',
          maxDaysAhead: 30,
          bufferBeforeMinutes: 0,
        }),
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
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          ← Back
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">Personal booking link</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Quick setup message */}
          <div className="bg-[#0D7377]/5 border border-[#0D7377]/20 rounded-xl p-4">
            <p className="text-sm text-[#0D7377]">
              <span className="font-medium">Keep it simple.</span> You can add team members and configure routing anytime.
            </p>
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What&apos;s this meeting for? *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={handleTitleChange}
                placeholder="e.g. 30-min intro call"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              />
              <p className="text-xs text-gray-400 mt-1">Customers see this on the booking page.</p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How long is the meeting?</label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, durationMinutes: d }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      form.durationMinutes === d ? 'bg-[#0D7377] text-white border-[#0D7377]' : 'border-gray-300 text-gray-700 hover:border-[#0D7377]'
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How will you meet?</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'google_meet', label: 'Google Meet', desc: 'Video conference' },
                  { value: 'phone_call', label: 'Phone Call', desc: 'Exchange phone numbers' },
                  { value: 'in_person', label: 'In person', desc: 'Provide a meeting address' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, meetingType: opt.value as any }))}
                    className={`text-left p-3 rounded-xl border-2 transition-colors ${
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

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your booking URL *
              </label>
              <div className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 transition-all ${
                slugStatus === 'available' ? 'border-green-300 focus-within:ring-green-400' :
                slugStatus === 'taken' ? 'border-red-300 focus-within:ring-red-400' :
                'border-gray-300 focus-within:ring-[#0D7377]'
              }`}>
                <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-300 whitespace-nowrap">/book/</span>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="intro-call"
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                />
                {slugStatus === 'checking' && (
                  <div className="px-3 text-gray-400">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                )}
                {slugStatus === 'available' && (
                  <div className="px-3 text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {slugStatus === 'taken' && (
                  <div className="px-3 text-red-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {slugStatus === 'available' && (
                <p className="text-xs text-green-600 mt-1 font-medium">✓ Available!</p>
              )}
              {slugStatus === 'taken' && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-red-600 font-medium">This URL is taken. Try one of these:</p>
                  <div className="flex flex-wrap gap-2">
                    {slugAlternatives.map(alt => (
                      <button
                        key={alt}
                        type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, slug: alt }))
                          setSlugStatus('available')
                          setSlugAlternatives([])
                        }}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                      >
                        /book/{alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Don&apos;t forget to set your availability in <Link href="/dashboard/settings" className="underline hover:text-gray-600">Settings</Link>. It applies to all your links.
          </p>

          <button
            type="submit"
            disabled={loading || !form.title || !form.slug || slugStatus !== 'available'}
            className="w-full py-3 bg-[#0D7377] text-white rounded-xl font-medium hover:bg-[#0a5f63] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating…' : slugStatus === 'checking' ? 'Checking URL…' : 'Create personal link'}
          </button>
        </form>
      </div>
    </main>
  )
}
