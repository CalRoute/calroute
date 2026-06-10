'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { format, parseISO } from 'date-fns'
import BookingActions from './BookingActions'
import { useToast } from '@/components/Toast'
import RescheduleDialog from './RescheduleDialog'
import ConfirmDialog from '@/components/ConfirmDialog'

const WeekCalendar = dynamic(() => import('./WeekCalendar'), { ssr: false })

interface Booking {
  id: string
  customerName: string
  customerEmail: string
  customerNotes: string | null
  customerPhone?: string | null
  startTime: string
  linkTitle: string
  linkSlug: string
  durationMinutes: number
  status: string
  teamMembers: Array<{ uid: string; name: string }>
}

interface Props {
  upcoming: Booking[]
  past: Booking[]
  cancelled: Booking[]
  rescheduled: Booking[]
  linkTitles: string[]
  teamMembersForFilter: Array<{ uid: string; name: string }>
  metrics: { total: number; confirmed: number; cancelled: number; rescheduled: number }
}

export default function BookingsClient({
  upcoming,
  past,
  cancelled,
  rescheduled,
  linkTitles,
  teamMembersForFilter,
  metrics,
}: Props) {
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLink, setFilterLink] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past' | 'cancelled' | 'rescheduled'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const filterBookings = (bookings: Booking[]) =>
    bookings.filter(b => {
      const matchesSearch = !searchQuery ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLink = !filterLink || b.linkTitle === filterLink
      const matchesDateRange =
        (!dateFrom || parseISO(b.startTime) >= parseISO(dateFrom + 'T00:00:00')) &&
        (!dateTo || parseISO(b.startTime) <= parseISO(dateTo + 'T23:59:59'))
      const matchesMember = !filterMember || b.teamMembers.some(m => m.uid === filterMember)
      return matchesSearch && matchesLink && matchesDateRange && matchesMember
    })

  const filteredUpcoming = filterStatus === 'all' || filterStatus === 'upcoming' ? filterBookings(upcoming) : []
  const filteredPast = filterStatus === 'all' || filterStatus === 'past' ? filterBookings(past) : []
  const filteredCancelled = filterStatus === 'all' || filterStatus === 'cancelled' ? filterBookings(cancelled) : []
  const filteredRescheduled = filterStatus === 'all' || filterStatus === 'rescheduled' ? filterBookings(rescheduled) : []

  const confirmedPct = metrics.total > 0 ? Math.round((metrics.confirmed / metrics.total) * 100) : 0
  const cancelledPct = metrics.total > 0 ? Math.round((metrics.cancelled / metrics.total) * 100) : 0
  const rescheduledPct = metrics.total > 0 ? Math.round((metrics.rescheduled / metrics.total) * 100) : 0

  const hasActiveFilters = searchQuery || filterLink || dateFrom || dateTo || filterMember

  const exportCSV = (bookingsToExport: Booking[]) => {
    if (bookingsToExport.length === 0) { showToast('No bookings to export', 'error'); return }
    const headers = ['Name', 'Email', 'Date', 'Time', 'Duration (min)', 'Link', 'Status', 'Notes']
    const rows = bookingsToExport.map(b => [
      b.customerName, b.customerEmail,
      format(parseISO(b.startTime), 'MMM d yyyy'),
      format(parseISO(b.startTime), 'h:mm a'),
      b.durationMinutes, b.linkTitle, b.status, b.customerNotes || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported', 'success')
  }

  const confirmBulkCancel = async () => {
    setShowConfirmCancel(false)
    setBulkLoading(true)
    try {
      const res = await fetch('/api/bookings/bulk/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: Array.from(selectedIds) }),
      })
      if (!res.ok) { const e = await res.json(); showToast(e.error || 'Failed to cancel', 'error'); return }
      const data = await res.json()
      setSelectedIds(new Set())
      showToast(`${data.successful} booking${data.successful !== 1 ? 's' : ''} cancelled`, 'success')
      window.location.reload()
    } catch { showToast('Error cancelling bookings', 'error') }
    finally { setBulkLoading(false) }
  }

  const handleBulkReschedule = async (newStartTime: string) => {
    setBulkLoading(true)
    try {
      const res = await fetch('/api/bookings/bulk/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: Array.from(selectedIds), newStartTime }),
      })
      if (!res.ok) { const e = await res.json(); showToast(e.error || 'Failed to reschedule', 'error'); return }
      const data = await res.json()
      setSelectedIds(new Set())
      setShowRescheduleDialog(false)
      showToast(`${data.successful} booking${data.successful !== 1 ? 's' : ''} rescheduled`, 'success')
      window.location.reload()
    } catch { showToast('Error rescheduling bookings', 'error') }
    finally { setBulkLoading(false) }
  }

  const allFiltered = [...filteredUpcoming, ...filteredPast, ...filteredCancelled, ...filteredRescheduled]

  const tabCounts = {
    all: allFiltered.length,
    upcoming: filteredUpcoming.length,
    past: filteredPast.length,
    cancelled: filteredCancelled.length,
    rescheduled: filteredRescheduled.length,
  }

  return (
    <div className={`space-y-5 ${selectedIds.size > 0 ? 'pb-28' : ''}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{metrics.total} total</p>
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-[#0D7377] text-white' : 'text-gray-500 hover:text-gray-800'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === 'week' ? 'bg-[#0D7377] text-white' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="flex-1 min-w-48 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] bg-gray-50"
            />
          </div>

          {/* Link filter */}
          <select
            value={filterLink}
            onChange={e => setFilterLink(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] bg-gray-50"
          >
            <option value="">All links</option>
            {linkTitles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <label className="text-xs text-gray-400 font-medium">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm bg-transparent focus:outline-none text-gray-700"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <label className="text-xs text-gray-400 font-medium">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-sm bg-transparent focus:outline-none text-gray-700"
            />
          </div>

          {/* Team member */}
          {teamMembersForFilter.length > 0 && (
            <select
              value={filterMember}
              onChange={e => setFilterMember(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] bg-gray-50"
            >
              <option value="">All members</option>
              {teamMembersForFilter.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
            </select>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            {hasActiveFilters && (
              <button
                onClick={() => { setSearchQuery(''); setFilterLink(''); setDateFrom(''); setDateTo(''); setFilterMember('') }}
                className="px-3 py-2 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => exportCSV(allFiltered)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + metrics */}
      <div>
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {(['all', 'upcoming', 'past', 'cancelled', 'rescheduled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${
                filterStatus === s ? 'border-[#0D7377] text-[#0D7377]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {s} <span className="text-xs opacity-60">({tabCounts[s]})</span>
            </button>
          ))}
        </div>
        {metrics.total > 0 && (
          <div className="flex items-center gap-4 pt-2 pb-1">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /><span className="text-gray-500">{confirmedPct}% confirmed</span></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /><span className="text-gray-500">{cancelledPct}% cancelled</span></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /><span className="text-gray-500">{rescheduledPct}% rescheduled</span></span>
            </div>
            <div className="flex h-1.5 flex-1 max-w-32 rounded-full overflow-hidden bg-gray-100">
              <div className="bg-teal-500 transition-all" style={{ width: `${confirmedPct}%` }} />
              <div className="bg-red-500 transition-all" style={{ width: `${cancelledPct}%` }} />
              <div className="bg-amber-400 transition-all" style={{ width: `${rescheduledPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-lg z-40">
          <p className="text-sm font-medium text-gray-900">{selectedIds.size} selected</p>
          <div className="flex gap-2">
            <button onClick={() => setShowConfirmCancel(true)} disabled={bulkLoading}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50">
              {bulkLoading ? 'Cancelling…' : 'Cancel'}
            </button>
            <button onClick={() => setShowRescheduleDialog(true)} disabled={bulkLoading}
              className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg disabled:opacity-50">
              Reschedule
            </button>
            <button
              onClick={() => {
                const sel = allFiltered.filter(b => selectedIds.has(b.id))
                exportCSV(sel)
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Export CSV
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Week view */}
      {viewMode === 'week' && (
        <WeekCalendar
          allBookings={allFiltered}
          selectedIds={selectedIds}
          onToggleSelect={id => {
            const s = new Set(selectedIds)
            s.has(id) ? s.delete(id) : s.add(id)
            setSelectedIds(s)
          }}
        />
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {(filterStatus === 'all' || filterStatus === 'upcoming') && (
            <Section title="Upcoming" count={filteredUpcoming.length} empty="No upcoming bookings" emptyAlt="No matching bookings" hasData={upcoming.length > 0}>
              {filteredUpcoming.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  isSelected={selectedIds.has(b.id)}
                  onToggleSelect={() => {
                    const s = new Set(selectedIds)
                    s.has(b.id) ? s.delete(b.id) : s.add(b.id)
                    setSelectedIds(s)
                  }}
                />
              ))}
            </Section>
          )}

          {(filterStatus === 'all' || filterStatus === 'past') && filteredPast.length > 0 && (
            <Section title="Past" count={filteredPast.length}>
              {filteredPast.map(b => <BookingCard key={b.id} booking={b} past />)}
            </Section>
          )}

          {(filterStatus === 'all' || filterStatus === 'cancelled') && filteredCancelled.length > 0 && (
            <Section title="Cancelled" count={filteredCancelled.length}>
              {filteredCancelled.map(b => <BookingCard key={b.id} booking={b} statusBadge="cancelled" />)}
            </Section>
          )}

          {(filterStatus === 'all' || filterStatus === 'rescheduled') && filteredRescheduled.length > 0 && (
            <Section title="Rescheduled" count={filteredRescheduled.length}>
              {filteredRescheduled.map(b => <BookingCard key={b.id} booking={b} statusBadge="rescheduled" />)}
            </Section>
          )}
        </div>
      )}

      {showRescheduleDialog && (
        <RescheduleDialog
          onClose={() => setShowRescheduleDialog(false)}
          onConfirm={handleBulkReschedule}
          isLoading={bulkLoading}
          count={selectedIds.size}
        />
      )}
      {showConfirmCancel && (
        <ConfirmDialog
          title="Cancel bookings?"
          message={`Cancel ${selectedIds.size} booking${selectedIds.size !== 1 ? 's' : ''}? Confirmation emails will be sent.`}
          confirmLabel="Cancel bookings"
          confirmClassName="bg-red-600 hover:bg-red-700"
          onConfirm={confirmBulkCancel}
          onClose={() => setShowConfirmCancel(false)}
          isLoading={bulkLoading}
        />
      )}
    </div>
  )
}

function Section({
  title, count, children, empty, emptyAlt, hasData,
}: {
  title: string
  count: number
  children: React.ReactNode
  empty?: string
  emptyAlt?: string
  hasData?: boolean
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title} · {count}</h3>
      {count === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{hasData ? emptyAlt : empty}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  )
}

function BookingCard({
  booking,
  past = false,
  statusBadge,
  isSelected = false,
  onToggleSelect,
}: {
  booking: Booking
  past?: boolean
  statusBadge?: 'cancelled' | 'rescheduled'
  isSelected?: boolean
  onToggleSelect?: () => void
}) {
  const initials = booking.customerName
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const accentColor = statusBadge === 'cancelled'
    ? 'bg-red-400'
    : statusBadge === 'rescheduled'
    ? 'bg-amber-400'
    : past
    ? 'bg-gray-200'
    : 'bg-[#0D7377]'

  const notes = typeof booking.customerNotes === 'string' ? booking.customerNotes : null

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-colors ${isSelected ? 'border-[#0D7377] shadow-sm' : 'border-gray-200'} ${past || statusBadge ? 'opacity-60' : ''}`}>
      <div className="flex">
        {/* Left accent */}
        <div className={`w-1 flex-shrink-0 ${accentColor}`} />

        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            {onToggleSelect && !past && !statusBadge && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="mt-1 w-4 h-4 rounded cursor-pointer accent-[#0D7377]"
              />
            )}

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${past || statusBadge ? 'bg-gray-100 text-gray-400' : 'bg-[#0D7377]/10 text-[#0D7377]'}`}>
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{booking.customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{booking.customerEmail}</p>
                  {booking.customerPhone && (
                    <p className="text-xs text-gray-500 mt-0.5">📞 {booking.customerPhone}</p>
                  )}
                </div>
                {/* Date */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">{format(parseISO(booking.startTime), 'MMM d')}</div>
                  <div className="text-xs text-gray-400">{format(parseISO(booking.startTime), 'h:mm a')}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-medium text-[#0D7377] bg-[#0D7377]/8 px-2 py-0.5 rounded-full">
                  {booking.linkTitle}
                </span>
                {statusBadge === 'cancelled' && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Cancelled</span>
                )}
                {statusBadge === 'rescheduled' && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Rescheduled</span>
                )}
              </div>

              {notes && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">"{notes}"</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {!past && !statusBadge && (
            <div className="mt-3 pl-11">
              <BookingActions
                bookingId={booking.id}
                customerEmail={booking.customerEmail}
                linkSlug={booking.linkSlug}
                durationMinutes={booking.durationMinutes}
                teamMembers={booking.teamMembers}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
