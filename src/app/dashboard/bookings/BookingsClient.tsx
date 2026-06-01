'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import BookingActions from './BookingActions'
import { useToast } from '@/components/Toast'

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

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
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

      {/* Upcoming */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming ({filteredUpcoming.length})</h3>
        {filteredUpcoming.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {upcoming.length === 0 ? 'No upcoming bookings' : 'No matching bookings'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUpcoming.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {filteredPast.length > 0 && (
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
      {filteredCancelled.length > 0 && (
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
    </div>
  )
}

function BookingCard({ booking, past = false }: { booking: Booking; past?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${past ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 text-sm truncate">{booking.customerName}</p>
          <p className="text-xs text-gray-500 truncate">{booking.customerEmail}</p>
          <p className="text-xs text-gray-600 mt-1">{booking.linkTitle}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-medium text-gray-900">{format(parseISO(booking.startTime), 'MMM d')}</div>
          <div className="text-xs text-gray-500">{format(parseISO(booking.startTime), 'h:mm a')}</div>
        </div>
      </div>
      {!past && <BookingActions bookingId={booking.id} customerEmail={booking.customerEmail} linkSlug={booking.linkSlug} durationMinutes={booking.durationMinutes} teamMembers={booking.teamMembers} />}
    </div>
  )
}
