'use client'

import { useState, useEffect } from 'react'
import {
  format, addDays, parseISO, startOfDay, startOfMonth,
  getDay, addMonths, subMonths, isBefore, isAfter,
  getDaysInMonth, setDate,
} from 'date-fns'
import { parsePhoneNumberFromString, isValidPhoneNumber, AsYouType } from 'libphonenumber-js'
import type { BookingLink } from '@/types/database'

interface Slot { start: string; end: string; assignedHostId: string }
interface Props { link: BookingLink; availableLanguages: string[] }
type Step = 'select-language' | 'select-date' | 'select-time' | 'fill-form' | 'confirmed'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function BookingWidget({ link, availableLanguages }: Props) {
  const needsLanguagePick = availableLanguages.length > 1
  const [step, setStep] = useState<Step>(needsLanguagePick ? 'select-language' : 'select-date')
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    availableLanguages.length === 1 ? availableLanguages[0] : null
  )
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()))

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const today = startOfDay(new Date())
  const maxDate = addDays(today, link.maxDaysAhead)

  // Fetch external user data on mount if enabled
  useEffect(() => {
    if (!link.externalDataEnabled) return

    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    // Skip if no query params provided
    if (Object.keys(queryParams).length === 0) return

    const fetchExternalData = async () => {
      try {
        const res = await fetch('/api/external-data/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostId: link.ownerId,
            queryParams,
          }),
        })

        if (res.ok) {
          const { data } = await res.json()
          // Pre-fill form with external data
          setForm(f => ({
            ...f,
            name: data.name || f.name,
            email: data.email || f.email,
            phone: data.phone || f.phone,
            notes: data.notes || f.notes,
          }))
        } else {
          const err = await res.json()
          console.warn('[external-data] lookup failed:', err.error)
        }
      } catch (err) {
        console.warn('[external-data] error:', err)
      }
    }

    fetchExternalData()
  }, [link.externalDataEnabled, link.ownerId])

  useEffect(() => {
    if (!selectedDate) return
    setLoading(true)
    setSlots([])
    setError(null)
    const langParam = selectedLanguage ? `&language=${encodeURIComponent(selectedLanguage)}` : ''
    fetch(`/api/availability?slug=${link.slug}&start=${selectedDate}&timezone=${encodeURIComponent(timezone)}${langParam}`)
      .then(r => r.json())
      .then(data => { setSlots(data.slots ?? []); setStep('select-time') })
      .catch(() => setError('Failed to load availability. Please try again.'))
      .finally(() => setLoading(false))
  }, [selectedDate, link.slug, timezone, selectedLanguage])

  const slotsOnDate = slots.filter(s =>
    format(parseISO(s.start), 'yyyy-MM-dd') === selectedDate
  )

  async function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot)
    setError(null)
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
    if (!res.ok) { setError(data.error ?? 'Failed to reserve slot'); return }
    setSessionToken(data.session_token)
    setStep('fill-form')
  }

  function handlePhoneChange(val: string) {
    const formatter = new AsYouType()
    const formatted = formatter.input(val)
    setForm(f => ({ ...f, phone: formatted }))

    if (formatted.trim() === '') {
      setPhoneError(null)
      return
    }

    const isValid = isValidPhoneNumber(formatted)
    if (!isValid) {
      setPhoneError('Please enter a valid phone number')
    } else {
      setPhoneError(null)
    }
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !sessionToken) return

    // Validate phone if required
    if (link.meetingType === 'phone_call') {
      if (!form.phone.trim()) {
        setPhoneError('Phone number is required for phone call bookings')
        return
      }
      if (!isValidPhoneNumber(form.phone)) {
        setPhoneError('Please enter a valid phone number')
        return
      }
    }

    setLoading(true)
    setError(null)

    // Include external data if available
    const externalData = link.externalDataEnabled
      ? Object.fromEntries(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''))
      : undefined

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
        customer_phone: link.meetingType === 'phone_call' ? form.phone : undefined,
        language: selectedLanguage || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        external_data: externalData,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Booking failed. Please try again.')
      if (res.status === 409) { setStep('select-time'); setSelectedSlot(null); setSessionToken(null) }
      return
    }
    setStep('confirmed')
  }

  // Build calendar grid
  const firstDayOfMonth = calendarMonth
  const startPadding = getDay(firstDayOfMonth)
  const daysInMonth = getDaysInMonth(calendarMonth)
  const calendarCells: (Date | null)[] = [
    ...Array(startPadding).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => setDate(calendarMonth, i + 1)),
  ]
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  const prevMonthDisabled = isBefore(addDays(startOfMonth(subMonths(calendarMonth, 1)), 30), today) ||
    startOfMonth(calendarMonth) <= startOfMonth(today)
  const nextMonthDisabled = isAfter(startOfMonth(addMonths(calendarMonth, 1)), startOfMonth(maxDate))

  function isDaySelectable(day: Date) {
    return !isBefore(day, today) && !isAfter(day, maxDate)
  }

  // ── Confirmed ──────────────────────────────────────────────────────────────
  if (step === 'confirmed' && selectedSlot) {
    return (
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-md mx-auto">
        <div className="h-1.5 bg-[#0D7377]" />
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-[#0D7377]/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">You&apos;re booked!</h2>
            <p className="text-gray-500 text-sm mt-1">
              A confirmation has been sent to <span className="font-medium text-gray-700">{form.email}</span>
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-2 border border-gray-100">
            <p className="font-semibold text-gray-900">{link.title}</p>
            <p className="text-sm text-gray-600">{format(parseISO(selectedSlot.start), 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-sm text-gray-600">
              {format(parseISO(selectedSlot.start), 'h:mm a')} – {format(parseISO(selectedSlot.end), 'h:mm a')}
            </p>
            <p className="text-xs text-gray-400">{timezone} · {link.durationMinutes} min</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Info sidebar content ────────────────────────────────────────────────────
  const InfoPanel = () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0D7377] mb-2">Meeting</p>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{link.title}</h1>
        {link.description && (
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">{link.description}</p>
        )}
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          {link.durationMinutes} minutes
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-600">
          <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </span>
          {timezone}
        </div>
        {selectedLanguage && step !== 'select-language' && (
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
              </svg>
            </span>
            {selectedLanguage}
            {needsLanguagePick && (
              <button
                onClick={() => { setStep('select-language'); setSelectedDate(null); setSlots([]) }}
                className="text-[#0D7377] text-xs hover:underline ml-0.5"
              >
                change
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
      <div className="h-1 bg-[#0D7377]" />

      <div className="flex flex-col lg:flex-row min-h-[480px]">

        {/* Left: info */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 p-6 sm:p-8 lg:border-r border-gray-100">
          <InfoPanel />
        </div>

        {/* Divider on mobile */}
        <div className="lg:hidden h-px bg-gray-100 mx-6" />

        {/* Right: booking steps */}
        <div className="flex-1 p-6 sm:p-8">

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Language pick */}
          {step === 'select-language' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Choose your language</h2>
                <p className="text-sm text-gray-500 mt-0.5">We&apos;ll match you with an available host.</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {availableLanguages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setSelectedLanguage(lang); setStep('select-date') }}
                    className="py-3.5 px-4 rounded-2xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-[#0D7377] hover:text-[#0D7377] hover:bg-[#0D7377]/5 transition-all text-left"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          {(step === 'select-date' || step === 'select-time') && (
            <div className="space-y-5">
              {/* Month nav */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCalendarMonth(m => startOfMonth(subMonths(m, 1)))}
                  disabled={prevMonthDisabled}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <span className="text-sm font-semibold text-gray-900">
                  {format(calendarMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setCalendarMonth(m => startOfMonth(addMonths(m, 1)))}
                  disabled={nextMonthDisabled}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-1">
                    {d[0]}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-y-1">
                {calendarCells.map((day, i) => {
                  if (!day) return <div key={i} />
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const isSelected = selectedDate === dateStr
                  const selectable = isDaySelectable(day)
                  const isToday = dateStr === format(today, 'yyyy-MM-dd')
                  return (
                    <button
                      key={dateStr}
                      onClick={() => selectable && setSelectedDate(dateStr)}
                      disabled={!selectable}
                      className={`aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all mx-auto w-9 h-9 ${
                        isSelected
                          ? 'bg-[#0D7377] text-white shadow-md'
                          : selectable
                          ? isToday
                            ? 'text-[#0D7377] font-bold hover:bg-[#0D7377]/10'
                            : 'text-gray-800 hover:bg-gray-100'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    {format(parseISO(selectedDate), 'EEEE, MMMM d')}
                  </p>

                  {loading && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                      <div className="w-4 h-4 border-2 border-gray-200 border-t-[#0D7377] rounded-full animate-spin" />
                      Loading times…
                    </div>
                  )}

                  {!loading && slotsOnDate.length === 0 && step === 'select-time' && (
                    <p className="text-sm text-gray-400 py-2">No availability — try another day.</p>
                  )}

                  {!loading && slotsOnDate.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {slotsOnDate.map(slot => (
                        <button
                          key={slot.start}
                          onClick={() => handleSlotSelect(slot)}
                          className="group w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-[#0D7377] hover:bg-[#0D7377]/5 transition-all"
                        >
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
          )}

          {/* Booking form */}
          {step === 'fill-form' && selectedSlot && (
            <form onSubmit={handleBookingSubmit} className="space-y-5">
              <div className="bg-[#0D7377]/8 border border-[#0D7377]/15 rounded-2xl p-4">
                <p className="text-sm font-semibold text-[#0D7377]">
                  {format(parseISO(selectedSlot.start), 'EEEE, MMMM d')} · {format(parseISO(selectedSlot.start), 'h:mm a')}
                </p>
                <p className="text-xs text-[#0D7377]/60 mt-0.5">{link.durationMinutes} min · reserved for 5 minutes</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</label>
                  <input
                    type="text" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Smith"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jane@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377] transition-all"
                  />
                </div>
                {link.meetingType === 'phone_call' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Phone number <span className="text-gray-300 font-normal normal-case">*</span>
                    </label>
                    <input
                      type="tel" required value={form.phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      onBlur={() => {
                        if (form.phone && !isValidPhoneNumber(form.phone)) {
                          setPhoneError('Please enter a valid phone number')
                        }
                      }}
                      placeholder="+1 (555) 000-0000"
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                        phoneError
                          ? 'border-red-300 focus:ring-red-300/30 focus:border-red-500'
                          : 'border-gray-200 focus:ring-[#0D7377]/30 focus:border-[#0D7377]'
                      }`}
                    />
                    {phoneError && (
                      <p className="text-xs text-red-600 mt-1.5">{phoneError}</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Notes <span className="text-gray-300 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    rows={3} value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Anything you'd like us to know…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377] transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('select-time'); setSelectedSlot(null); setSessionToken(null) }}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[#0D7377] text-white text-sm font-semibold hover:bg-[#0a5f63] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loading ? 'Confirming…' : 'Confirm booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
