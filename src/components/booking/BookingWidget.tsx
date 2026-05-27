'use client'

import { useState, useEffect } from 'react'
import { format, addDays, parseISO, startOfDay } from 'date-fns'
import type { BookingLink } from '@/types/database'

interface Slot {
  start: string
  end: string
  assignedHostId: string
}

interface Props {
  link: BookingLink
}

type Step = 'select-date' | 'select-time' | 'fill-form' | 'confirmed'

export default function BookingWidget({ link }: Props) {
  const [step, setStep] = useState<Step>('select-date')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', notes: '' })

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const dates = Array.from({ length: link.maxDaysAhead }, (_, i) =>
    addDays(startOfDay(new Date()), i)
  )

  // Load slots when date is selected
  useEffect(() => {
    if (!selectedDate) return

    setLoading(true)
    setSlots([])
    setError(null)

    fetch(`/api/availability?slug=${link.slug}&start=${selectedDate}&timezone=${encodeURIComponent(timezone)}`)
      .then(r => r.json())
      .then(data => {
        setSlots(data.slots ?? [])
        setStep('select-time')
      })
      .catch(() => setError('Failed to load availability. Please try again.'))
      .finally(() => setLoading(false))
  }, [selectedDate, link.slug, timezone])

  const slotsOnDate = slots.filter(s =>
    format(parseISO(s.start), 'yyyy-MM-dd') === selectedDate
  )

  async function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot)
    setError(null)

    // Reserve the slot
    const res = await fetch('/api/slots/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_link_id: link.id,
        host_id: slot.assignedHostId,
        start_time: slot.start,
        duration_minutes: link.durationMinutes,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to reserve slot')
      return
    }

    setSessionToken(data.session_token)
    setStep('fill-form')
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !sessionToken) return

    setLoading(true)
    setError(null)

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: link.slug,
        start_time: selectedSlot.start,
        host_id: selectedSlot.assignedHostId,
        session_token: sessionToken,
        customer_name: form.name,
        customer_email: form.email,
        customer_notes: form.notes || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Booking failed. Please try again.')
      if (res.status === 409) {
        setStep('select-time')
        setSelectedSlot(null)
        setSessionToken(null)
        // Refresh slots
        setSelectedDate(prev => prev)
      }
      return
    }

    setBookingId(data.booking_id)
    setStep('confirmed')
  }

  if (step === 'confirmed') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">You&apos;re booked!</h2>
        <p className="text-gray-600 mb-4">
          A confirmation has been sent to <strong>{form.email}</strong>
        </p>
        {selectedSlot && (
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-1">
            <p className="text-sm text-gray-500">Meeting details</p>
            <p className="font-medium">{link.title}</p>
            <p className="text-gray-700">
              {format(parseISO(selectedSlot.start), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-gray-700">
              {format(parseISO(selectedSlot.start), 'h:mm a')} –{' '}
              {format(parseISO(selectedSlot.end), 'h:mm a')} ({timezone})
            </p>
            <p className="text-sm text-gray-500">{link.durationMinutes} minutes</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">{link.title}</h1>
        {link.description && (
          <p className="text-gray-500 text-sm mt-1">{link.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-1">{link.durationMinutes} min · {timezone}</p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Date selection */}
        {(step === 'select-date' || step === 'select-time') && (
          <>
            <h2 className="text-sm font-medium text-gray-700 mb-3">Select a date</h2>
            <div className="grid grid-cols-7 gap-1.5 mb-6">
              {dates.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const isSelected = selectedDate === dateStr
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center p-2 rounded-xl text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{format(date, 'EEE').toUpperCase()}</span>
                    <span className={`text-lg font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {format(date, 'd')}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Step 2: Time slot selection */}
            {loading && (
              <div className="text-center py-6 text-gray-400 text-sm">Loading available times…</div>
            )}

            {!loading && step === 'select-time' && slotsOnDate.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                No availability on this date. Please try another day.
              </div>
            )}

            {!loading && slotsOnDate.length > 0 && (
              <>
                <h2 className="text-sm font-medium text-gray-700 mb-3">
                  Available times for {selectedDate && format(parseISO(selectedDate), 'MMMM d')}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {slotsOnDate.map(slot => (
                    <button
                      key={slot.start}
                      onClick={() => handleSlotSelect(slot)}
                      className="py-2.5 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      {format(parseISO(slot.start), 'h:mm a')}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Step 3: Booking form */}
        {step === 'fill-form' && selectedSlot && (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
              <p className="text-sm font-medium text-blue-900">
                {format(parseISO(selectedSlot.start), 'EEEE, MMMM d')} at{' '}
                {format(parseISO(selectedSlot.start), 'h:mm a')} ({timezone})
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Reserved for 5 minutes · {link.durationMinutes} min meeting
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional notes <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Anything you'd like us to know before the meeting…"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep('select-time'); setSelectedSlot(null); setSessionToken(null) }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 flex-grow py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Confirming…' : 'Confirm booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
