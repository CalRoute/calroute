export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import BookingActions from './BookingActions'

export default async function BookingsPage() {
  const user = await requireUser('/dashboard/bookings')

  const snap = await adminDb
    .collection('bookings')
    .where('hostId', '==', user.uid)
    .get()

  const allBookings = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data()
      const linkSnap = await adminDb.collection('booking_links').doc(data.bookingLinkId).get()
      return { id: d.id, ...data, linkTitle: linkSnap.data()?.title ?? 'Deleted link' } as any
    })
  )

  const bookings = allBookings
    .filter(b => b.status === 'confirmed')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const now = new Date().toISOString()
  const upcoming = bookings.filter(b => b.startTime >= now)
  const past = bookings.filter(b => b.startTime < now)

  return (
    <main className="min-h-screen bg-[#F7F4EF]">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">Bookings</span>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Upcoming */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Upcoming</h2>

          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">No upcoming bookings.</p>
            </div>
          ) : (
            upcoming.map(booking => (
              <div key={booking.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  {/* Date block */}
                  <div className="flex-shrink-0 w-14 text-center bg-[#0D7377]/8 rounded-xl py-2.5">
                    <p className="text-xs font-semibold text-[#0D7377] uppercase">
                      {format(parseISO(booking.startTime), 'MMM')}
                    </p>
                    <p className="text-2xl font-bold text-[#0D7377] leading-none mt-0.5">
                      {format(parseISO(booking.startTime), 'd')}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{booking.customerName}</p>
                    <p className="text-sm text-gray-500 truncate">{booking.linkTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(booking.startTime), 'EEEE')} at {format(parseISO(booking.startTime), 'h:mm a')}
                    </p>
                    {booking.customerNotes && (
                      <p className="text-xs text-gray-400 mt-1 italic truncate">"{booking.customerNotes}"</p>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-4">
                  <BookingActions bookingId={booking.id} customerEmail={booking.customerEmail} />
                </div>
              </div>
            ))
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Past</h2>
            {past.map(booking => (
              <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-5 opacity-60">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 text-center bg-gray-50 rounded-xl py-2.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      {format(parseISO(booking.startTime), 'MMM')}
                    </p>
                    <p className="text-2xl font-bold text-gray-400 leading-none mt-0.5">
                      {format(parseISO(booking.startTime), 'd')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700 truncate">{booking.customerName}</p>
                    <p className="text-sm text-gray-400 truncate">{booking.linkTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(booking.startTime), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
