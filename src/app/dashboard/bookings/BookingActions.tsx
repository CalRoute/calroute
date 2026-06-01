'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { useToast } from '@/components/Toast'
import {
  format, parseISO, startOfDay, addDays, startOfMonth,
  getDay, addMonths, subMonths, isBefore, isAfter,
  getDaysInMonth, setDate,
} from 'date-fns'

type TeamMember = { uid: string; name: string }
type Slot = { start: string; end: string; assignedHostId: string }
type ConfirmAction = { type: 'cancel'; email: string } | { type: 'transfer'; name: string; uid: string } | null

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  bookingId: string
  customerEmail: string
  linkSlug: string
  durationMinutes: number
  teamMembers: TeamMember[]
}

export default function BookingActions({ bookingId, customerEmail, linkSlug, durationMinutes, teamMembers }: Props) {
  const [mode, setMode] = useState<'idle' | 'reschedule' | 'transfer'>('idle')
  const [cancelling, setCancelling] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { showToast } = useToast()

  async function handleConfirmCancel() {
    if (confirmAction?.type !== 'cancel') return
    setCancelling(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to cancel'); setCancelling(false); return }
      showToast('Booking cancelled', 'success')
      setConfirmAction(null)
      router.refresh()
    } catch {
      setError('Something went wrong.')
      setCancelling(false)
    }
  }

  async function handleConfirmTransfer() {
    if (confirmAction?.type !== 'transfer') return
    setCancelling(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newHostId: confirmAction.uid }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to transfer'); setCancelling(false); return }
      showToast('Booking transferred', 'success')
      setConfirmAction(null)
      router.refresh()
    } catch {
      setError('Something went wrong.')
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setMode(mode === 'reschedule' ? 'idle' : 'reschedule')}
          className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
            mode === 'reschedule'
              ? 'bg-[#0D7377] text-white border-[#0D7377]'
              : 'text-gray-500 hover:text-gray-900 border-gray-200 hover:border-gray-300'
          }`}
        >
          Reschedule
        </button>
        {teamMembers.length > 0 && (
          <button
            onClick={() => setMode(mode === 'transfer' ? 'idle' : 'transfer')}
            className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
              mode === 'transfer'
                ? 'bg-[#0D7377] text-white border-[#0D7377]'
                : 'text-gray-500 hover:text-gray-900 border-gray-200 hover:border-gray-300'
            }`}
          >
            Transfer
          </button>
        )}
        <button
          onClick={() => setConfirmAction({ type: 'cancel', email: customerEmail })}
          disabled={cancelling}
          className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : 'Cancel'}
        </button>
      </div>

      {mode === 'reschedule' && (
        <ReschedulePanel
          bookingId={bookingId}
          linkSlug={linkSlug}
          durationMinutes={durationMinutes}
          onDone={() => { setMode('idle'); showToast('Booking rescheduled', 'success'); router.refresh() }}
          onError={setError}
        />
      )}

      {mode === 'transfer' && (
        <TransferPanel
          teamMembers={teamMembers}
          onConfirm={(uid, name) => setConfirmAction({ type: 'transfer', uid, name })}
        />
      )}

      {/* Confirmation Dialog */}
      <Dialog.Root open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 max-w-sm z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              {confirmAction?.type === 'cancel' ? 'Cancel booking?' : 'Transfer booking?'}
            </Dialog.Title>
            <p className="text-sm text-gray-600 mb-6">
              {confirmAction?.type === 'cancel'
                ? `Cancel this booking with ${confirmAction.email}?`
                : `Transfer this booking to ${confirmAction?.name}?`}
            </p>
            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Dismiss
                </button>
              </Dialog.Close>
              <button
                onClick={() => {
                  if (confirmAction?.type === 'cancel') handleConfirmCancel()
                  else handleConfirmTransfer()
                }}
                disabled={cancelling}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  confirmAction?.type === 'cancel'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#0D7377] hover:bg-[#0a5f63]'
                }`}
              >
                {cancelling ? 'Processing…' : confirmAction?.type === 'cancel' ? 'Cancel booking' : 'Transfer'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function TransferPanel({ teamMembers, onConfirm }: {
  teamMembers: TeamMember[]
  onConfirm: (uid: string, name: string) => void
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
      <p className="text-xs font-medium text-gray-600">Transfer to:</p>
      {teamMembers.map(m => (
        <button
          key={m.uid}
          onClick={() => onConfirm(m.uid, m.name)}
          className="w-full text-left text-sm text-gray-700 hover:text-[#0D7377] hover:bg-white border border-transparent hover:border-gray-200 rounded-lg px-3 py-2 transition-all"
        >
          {m.name}
        </button>
      ))}
    </div>
  )
}

function ReschedulePanel({ bookingId, linkSlug, durationMinutes, onDone, onError }: {
  bookingId: string
  linkSlug: string
  durationMinutes: number
  onDone: () => void
  onError: (e: string) => void
}) {
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const today = startOfDay(new Date())
  const maxDate = addDays(today, 30)

  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSlots([])
    fetch(`/api/availability?slug=${linkSlug}&start=${selectedDate}&timezone=${encodeURIComponent(timezone)}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => onError('Failed to load slots'))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, linkSlug, timezone])

  const slotsOnDate = slots.filter(s => format(parseISO(s.start), 'yyyy-MM-dd') === selectedDate)

  async function handleSlot(slot: Slot) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStartTime: slot.start }),
      })
      const data = await res.json()
      if (!res.ok) { onError(data.error ?? 'Failed to reschedule'); setSubmitting(false); return }
      onDone()
    } catch {
      onError('Something went wrong.')
      setSubmitting(false)
    }
  }

  const startPadding = getDay(calendarMonth)
  const cells: (Date | null)[] = [
    ...Array(startPadding).fill(null),
    ...Array.from({ length: getDaysInMonth(calendarMonth) }, (_, i) => setDate(calendarMonth, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const prevDisabled = startOfMonth(calendarMonth) <= startOfMonth(today)
  const nextDisabled = isAfter(startOfMonth(addMonths(calendarMonth, 1)), startOfMonth(maxDate))

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCalendarMonth(m => startOfMonth(subMonths(m, 1)))} disabled={prevDisabled}
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-xs font-semibold text-gray-700">{format(calendarMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCalendarMonth(m => startOfMonth(addMonths(m, 1)))} disabled={nextDisabled}
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-0.5">{d[0]}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = format(day, 'yyyy-MM-dd')
          const isSelected = selectedDate === dateStr
          const ok = !isBefore(day, today) && !isAfter(day, maxDate)
          return (
            <button key={dateStr} onClick={() => ok && setSelectedDate(dateStr)} disabled={!ok}
              className={`aspect-square flex items-center justify-center rounded-full text-xs font-medium mx-auto w-7 h-7 transition-all ${
                isSelected ? 'bg-[#0D7377] text-white'
                : ok ? 'text-gray-700 hover:bg-gray-200'
                : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="border-t border-gray-200 pt-2 space-y-1.5">
          <p className="text-xs font-medium text-gray-600">{format(parseISO(selectedDate), 'EEE, MMM d')}</p>
          {loadingSlots && <p className="text-xs text-gray-400">Loading…</p>}
          {!loadingSlots && slotsOnDate.length === 0 && <p className="text-xs text-gray-400">No availability — try another day.</p>}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {slotsOnDate.map(slot => (
              <button key={slot.start} onClick={() => !submitting && handleSlot(slot)} disabled={submitting}
                className="w-full text-left text-xs text-gray-700 hover:text-[#0D7377] hover:bg-white border border-transparent hover:border-gray-200 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50">
                {format(parseISO(slot.start), 'h:mm a')} · {durationMinutes} min
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
