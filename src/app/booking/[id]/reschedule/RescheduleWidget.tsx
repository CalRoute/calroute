'use client'

import { useState, useEffect } from 'react'
import {
  format, parseISO, startOfDay, addDays, startOfMonth,
  getDay, addMonths, subMonths, isBefore, isAfter,
  getDaysInMonth, setDate,
} from 'date-fns'

interface Slot { start: string; end: string; assignedHostId: string }

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function RescheduleWidget({
  bookingId, token, link, currentStartTime, language,
}: {
  bookingId: string
  token: string
  link: any
  currentStartTime: string
  language?: string
}) {
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const today = startOfDay(new Date())
  const maxDate = addDays(today, link.maxDaysAhead ?? 30)

  useEffect(() => {
    if (!selectedDate) return
    setLoading(true)
    setSlots([])
    const params = new URLSearchParams({
      slug: link.slug,
      start: selectedDate,
      timezone,
      ...(language && { language }),
    })
    fetch(`/api/availability?${params}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => setError('Failed to load slots'))
      .finally(() => setLoading(false))
  }, [selectedDate, link.slug, timezone, language])

  const slotsOnDate = slots.filter(s =>
    format(parseISO(s.start), 'yyyy-MM-dd') === selectedDate &&
    s.start !== currentStartTime
  )

  async function handleSelect(slot: Slot) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newStartTime: slot.start }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to reschedule'); setSubmitting(false); return }
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3">
        <div className="w-12 h-12 bg-[#0D7377]/10 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900">Meeting rescheduled!</p>
        <p className="text-sm text-gray-500">A confirmation with the new details has been sent to your email.</p>
      </div>
    )
  }

  // Calendar grid
  const startPadding = getDay(calendarMonth)
  const daysInMonth = getDaysInMonth(calendarMonth)
  const cells: (Date | null)[] = [
    ...Array(startPadding).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => setDate(calendarMonth, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const prevDisabled = startOfMonth(calendarMonth) <= startOfMonth(today)
  const nextDisabled = isAfter(startOfMonth(addMonths(calendarMonth, 1)), startOfMonth(maxDate))

  function selectable(day: Date) {
    return !isBefore(day, today) && !isAfter(day, maxDate)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="h-1 bg-[#0D7377]" />
      <div className="p-6 space-y-5">
        <p className="text-sm font-semibold text-gray-700">Pick a new time</p>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => setCalendarMonth(m => startOfMonth(subMonths(m, 1)))} disabled={prevDisabled}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900">{format(calendarMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCalendarMonth(m => startOfMonth(addMonths(m, 1)))} disabled={nextDisabled}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-1">{d[0]}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr = format(day, 'yyyy-MM-dd')
            const isSelected = selectedDate === dateStr
            const ok = selectable(day)
            const isToday = dateStr === format(today, 'yyyy-MM-dd')
            return (
              <button key={dateStr} onClick={() => ok && setSelectedDate(dateStr)} disabled={!ok}
                className={`aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all mx-auto w-9 h-9 ${
                  isSelected ? 'bg-[#0D7377] text-white shadow-md'
                  : ok ? isToday ? 'text-[#0D7377] font-bold hover:bg-[#0D7377]/10'
                    : 'text-gray-800 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>

        {/* Slots */}
        {selectedDate && (
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-sm font-semibold text-gray-900">{format(parseISO(selectedDate), 'EEEE, MMMM d')}</p>
            {loading && <p className="text-sm text-gray-400">Loading times…</p>}
            {!loading && slotsOnDate.length === 0 && (
              <p className="text-sm text-gray-400">No availability on this date. Try another day.</p>
            )}
            {!loading && slotsOnDate.length > 0 && (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {slotsOnDate.map(slot => (
                  <button key={slot.start} onClick={() => !submitting && handleSelect(slot)} disabled={submitting}
                    className="group w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-[#0D7377] hover:bg-[#0D7377]/5 transition-all disabled:opacity-50">
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-[#0D7377] transition-colors">
                      {format(parseISO(slot.start), 'h:mm a')}
                    </span>
                    <span className="text-xs text-gray-400 group-hover:text-[#0D7377]/70 transition-colors">
                      {link.durationMinutes} min →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
