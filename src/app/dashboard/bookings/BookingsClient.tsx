'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { format, parseISO } from 'date-fns'
import BookingActions from './BookingActions'
import { useToast } from '@/components/Toast'
import RescheduleDialog from './RescheduleDialog'

const WeekCalendar = dynamic(() => import('./WeekCalendar'), { ssr: false })

interface Booking {
  id: string
  customerName: string
  customerEmail: string
  customerNotes: string | null
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

  const filterBookings = (bookings: Booking[]) => {
    return bookings.filter(b => {
      const matchesSearch = !searchQuery ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesLink = !filterLink || b.linkTitle === filterLink

      const matchesDateRange =
        (!dateFrom || parseISO(b.startTime) >= parseISO(dateFrom + 'T00:00:00')) &&
        (!dateTo || parseISO(b.startTime) <= parseISO(dateTo + 'T23:59:59'))

      const matchesMember =
        !filterMember || b.teamMembers.some(m => m.uid === filterMember)

      return matchesSearch && matchesLink && matchesDateRange && matchesMember
    })
  }

  const filteredUpcoming = filterStatus === 'all' || filterStatus === 'upcoming' ? filterBookings(upcoming) : []
  const filteredPast = filterStatus === 'all' || filterStatus === 'past' ? filterBookings(past) : []
  const filteredCancelled = filterStatus === 'all' || filterStatus === 'cancelled' ? filterBookings(cancelled) : []
  const filteredRescheduled = filterStatus === 'all' || filterStatus === 'rescheduled' ? filterBookings(rescheduled) : []

  const confirmedPct = metrics.total > 0 ? Math.round((metrics.confirmed / metrics.total) * 100) : 0
  const cancelledPct = metrics.total > 0 ? Math.round((metrics.cancelled / metrics.total) * 100) : 0
  const rescheduledPct = metrics.total > 0 ? Math.round((metrics.rescheduled / metrics.total) * 100) : 0

  const handleBulkCancel = async () => {
    if (!window.confirm(`Cancel ${selectedIds.size} booking${selectedIds.size !== 1 ? 's' : ''}? Confirmation emails will be sent.`)) {
      return
    }

    setBulkLoading(true)
    try {
      const res = await fetch('/api/bookings/bulk/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: Array.from(selectedIds) }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to cancel bookings', 'error')
        return
      }

      const data = await res.json()
      setSelectedIds(new Set())
      showToast(`${data.successful} booking${data.successful !== 1 ? 's' : ''} cancelled`, 'success')
      window.location.reload()
    } catch (error) {
      showToast('Error cancelling bookings', 'error')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkReschedule = async (newStartTime: string) => {
    setBulkLoading(true)
    try {
      const res = await fetch('/api/bookings/bulk/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: Array.from(selectedIds), newStartTime }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to reschedule bookings', 'error')
        return
      }

      const data = await res.json()
      setSelectedIds(new Set())
      setShowRescheduleDialog(false)
      showToast(`${data.successful} booking${data.successful !== 1 ? 's' : ''} rescheduled`, 'success')
      window.location.reload()
    } catch (error) {
      showToast('Error rescheduling bookings', 'error')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar - Row 1 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
          />
        </div>
        <select
          value={filterLink}
          onChange={(e) => setFilterLink(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] bg-white"
        >
          <option value="">All booking links</option>
          {linkTitles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
      </div>

      {/* Filter Bar - Row 2: Date range + Team member + View toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex gap-2 flex-1 sm:flex-none">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
            placeholder="To"
          />
        </div>
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] bg-white"
        >
          <option value="">All team members</option>
          {teamMembersForFilter.map(member => (
            <option key={member.uid} value={member.uid}>{member.name}</option>
          ))}
        </select>
        <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-1 rounded text-sm font-medium ${viewMode === 'list' ? 'bg-[#0D7377]/10 text-[#0D7377]' : 'text-gray-500'}`}
          >
            ≡ List
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-2 py-1 rounded text-sm font-medium ${viewMode === 'week' ? 'bg-[#0D7377]/10 text-[#0D7377]' : 'text-gray-500'}`}
          >
            ◻ Week
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['all', 'upcoming', 'past', 'cancelled', 'rescheduled'] as const).map(status => {
          const counts = {
            all: filteredUpcoming.length + filteredPast.length + filteredCancelled.length + filteredRescheduled.length,
            upcoming: filteredUpcoming.length,
            past: filteredPast.length,
            cancelled: filteredCancelled.length,
            rescheduled: filteredRescheduled.length,
          }
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                filterStatus === status
                  ? 'border-[#0D7377] text-[#0D7377]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {status} <span className="text-xs text-gray-500">({counts[status]})</span>
            </button>
          )
        })}
      </div>

      {/* Metrics Bar */}
      {metrics.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
          <p className="text-xs font-medium text-gray-500">Response metrics</p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-teal-600">{confirmedPct}%</span> confirmed ·{' '}
            <span className="font-semibold text-red-600">{cancelledPct}%</span> cancelled ·{' '}
            <span className="font-semibold text-amber-600">{rescheduledPct}%</span> rescheduled
          </p>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
            <div className="bg-teal-500" style={{ width: `${confirmedPct}%` }} />
            <div className="bg-red-500" style={{ width: `${cancelledPct}%` }} />
            <div className="bg-amber-500" style={{ width: `${rescheduledPct}%` }} />
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-t-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{selectedIds.size} selected</p>
          <div className="flex gap-2">
            <button
              onClick={handleBulkCancel}
              disabled={bulkLoading}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
            >
              {bulkLoading ? 'Cancelling...' : 'Cancel all'}
            </button>
            <button
              onClick={() => setShowRescheduleDialog(true)}
              disabled={bulkLoading}
              className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg disabled:opacity-50"
            >
              Reschedule
            </button>
            <button
              onClick={() => {
                const headers = ['Name', 'Email', 'Date', 'Time', 'Duration (min)', 'Link', 'Status', 'Notes']
                const rows = Array.from(selectedIds).map(id => {
                  const booking = filteredUpcoming.find(b => b.id === id)
                  if (!booking) return []
                  return [
                    booking.customerName,
                    booking.customerEmail,
                    format(parseISO(booking.startTime), 'MMM d yyyy'),
                    format(parseISO(booking.startTime), 'h:mm a'),
                    booking.durationMinutes,
                    booking.linkTitle,
                    booking.status,
                    booking.customerNotes || '',
                  ]
                })
                const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
                a.click()
                URL.revokeObjectURL(url)
                showToast('CSV exported', 'success')
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Export CSV
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Week Calendar View */}
      {viewMode === 'week' && (
        <WeekCalendar
          allBookings={[...filteredUpcoming, ...filteredPast, ...filteredCancelled, ...filteredRescheduled]}
          selectedIds={selectedIds}
          onToggleSelect={(id) => {
            const newIds = new Set(selectedIds)
            if (newIds.has(id)) newIds.delete(id)
            else newIds.add(id)
            setSelectedIds(newIds)
          }}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Upcoming */}
      {(filterStatus === 'all' || filterStatus === 'upcoming') && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming ({filteredUpcoming.length})</h3>
          {filteredUpcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {upcoming.length === 0 ? 'No upcoming bookings' : 'No matching bookings'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUpcoming.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  isSelected={selectedIds.has(booking.id)}
                  onToggleSelect={() => {
                    const newIds = new Set(selectedIds)
                    if (newIds.has(booking.id)) newIds.delete(booking.id)
                    else newIds.add(booking.id)
                    setSelectedIds(newIds)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Past */}
      {(filterStatus === 'all' || filterStatus === 'past') && filteredPast.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Past ({filteredPast.length})</h3>
          <div className="space-y-3 opacity-60">
            {filteredPast.map(booking => (
              <BookingCard key={booking.id} booking={booking} past />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled */}
      {(filterStatus === 'all' || filterStatus === 'cancelled') && filteredCancelled.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Cancelled ({filteredCancelled.length})</h3>
          <div className="space-y-3 opacity-60">
            {filteredCancelled.map(booking => (
              <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Cancelled</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">{booking.customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{booking.customerEmail}</p>
                  <p className="text-xs text-gray-600 mt-1">{booking.linkTitle}</p>
                  {booking.customerNotes && (
                    <p className="text-xs text-gray-500 italic mt-1">"{booking.customerNotes}"</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">{format(parseISO(booking.startTime), 'MMM d')}</div>
                  <div className="text-xs text-gray-500">{format(parseISO(booking.startTime), 'h:mm a')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rescheduled */}
      {(filterStatus === 'all' || filterStatus === 'rescheduled') && filteredRescheduled.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Rescheduled ({filteredRescheduled.length})</h3>
          <div className="space-y-3 opacity-60">
            {filteredRescheduled.map(booking => (
              <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">Rescheduled</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">{booking.customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{booking.customerEmail}</p>
                  <p className="text-xs text-gray-600 mt-1">{booking.linkTitle}</p>
                  {booking.customerNotes && (
                    <p className="text-xs text-gray-500 italic mt-1">"{booking.customerNotes}"</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">{format(parseISO(booking.startTime), 'MMM d')}</div>
                  <div className="text-xs text-gray-500">{format(parseISO(booking.startTime), 'h:mm a')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* Reschedule Dialog */}
      {showRescheduleDialog && (
        <RescheduleDialog
          onClose={() => setShowRescheduleDialog(false)}
          onConfirm={handleBulkReschedule}
          isLoading={bulkLoading}
          count={selectedIds.size}
        />
      )}
    </div>
  )
}

function BookingCard({
  booking,
  past = false,
  isSelected = false,
  onToggleSelect,
}: {
  booking: Booking
  past?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}) {
  return (
    <div className={`bg-white rounded-xl border ${isSelected ? 'border-[#0D7377] bg-[#0D7377]/5' : 'border-gray-200'} p-4 ${past ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3 mb-3">
        {onToggleSelect && !past && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-1 w-4 h-4 cursor-pointer"
          />
        )}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 text-sm truncate">{booking.customerName}</p>
            <p className="text-xs text-gray-500 truncate">{booking.customerEmail}</p>
            <p className="text-xs text-gray-600 mt-1">{booking.linkTitle}</p>
            {booking.customerNotes && (
              <p className="text-xs text-gray-500 italic mt-1">"{booking.customerNotes}"</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-medium text-gray-900">{format(parseISO(booking.startTime), 'MMM d')}</div>
            <div className="text-xs text-gray-500">{format(parseISO(booking.startTime), 'h:mm a')}</div>
          </div>
        </div>
      </div>
      {!past && <BookingActions bookingId={booking.id} customerEmail={booking.customerEmail} linkSlug={booking.linkSlug} durationMinutes={booking.durationMinutes} teamMembers={booking.teamMembers} />}
    </div>
  )
}
