'use client'

import { useState } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, addWeeks, subWeeks } from 'date-fns'

interface Booking {
  id: string
  customerName: string
  customerEmail: string
  startTime: string
  status: string
  durationMinutes: number
  linkTitle: string
}

interface Props {
  allBookings: Booking[]
}

export default function WeekCalendar({ allBookings }: Props) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()))
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const weekEnd = endOfWeek(weekStart)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const today = new Date()
  const todayDate = format(today, 'yyyy-MM-dd')

  const getBookingsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    return allBookings.filter(b => {
      const bookingDate = format(parseISO(b.startTime), 'yyyy-MM-dd')
      return bookingDate === dayStr
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-teal-100 text-teal-800 border-teal-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'rescheduled':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart(subWeeks(weekStart, 1))}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          ← Prev week
        </button>
        <h3 className="font-semibold text-gray-900">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h3>
        <button
          onClick={() => setWeekStart(addWeeks(weekStart, 1))}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Next week →
        </button>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()]
          const isToday = dayStr === todayDate
          const bookings = getBookingsForDay(day)

          return (
            <div
              key={dayStr}
              className={`rounded-xl border p-3 min-h-48 space-y-2 ${
                isToday ? 'bg-[#0D7377]/5 border-[#0D7377]' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-500">{dayName}</p>
                <p className={`text-sm font-bold ${isToday ? 'text-[#0D7377]' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </p>
              </div>

              <div className="space-y-1">
                {bookings.map(booking => (
                  <button
                    key={booking.id}
                    onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                    className={`w-full text-left p-2 text-xs rounded-lg border font-medium truncate transition-all ${getStatusColor(booking.status)}`}
                  >
                    {booking.customerName}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Expanded Detail */}
      {expandedId && (
        <div className="border-t border-gray-200 pt-4 space-y-2">
          {allBookings.find(b => b.id === expandedId) && (
            (() => {
              const booking = allBookings.find(b => b.id === expandedId)!
              return (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{booking.customerName}</p>
                      <p className="text-xs text-gray-600">{booking.customerEmail}</p>
                    </div>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Time:</span> {format(parseISO(booking.startTime), 'h:mm a')}
                    </p>
                    <p>
                      <span className="font-medium">Duration:</span> {booking.durationMinutes} minutes
                    </p>
                    <p>
                      <span className="font-medium">Link:</span> {booking.linkTitle}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span> {booking.status}
                    </p>
                  </div>
                </div>
              )
            })()
          )}
        </div>
      )}
    </div>
  )
}
