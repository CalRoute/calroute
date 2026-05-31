export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'
import { format, parseISO, isBefore, addHours } from 'date-fns'
import RescheduleWidget from './RescheduleWidget'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function ReschedulePage({ params, searchParams }: Props) {
  const { id } = await params
  const { token } = await searchParams

  const bookingSnap = await adminDb.collection('bookings').doc(id).get()
  if (!bookingSnap.exists) notFound()

  const booking = bookingSnap.data()!

  if (!token || token !== booking.rescheduleToken) {
    return (
      <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-medium">Invalid reschedule link.</p>
        </div>
      </main>
    )
  }

  if (booking.status === 'cancelled') {
    return (
      <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center space-y-2">
          <p className="font-semibold text-gray-900">Booking cancelled</p>
          <p className="text-sm text-gray-500">This booking has already been cancelled and cannot be rescheduled.</p>
        </div>
      </main>
    )
  }

  const meetingStart = parseISO(booking.startTime)
  const pastDeadline = isBefore(meetingStart, addHours(new Date(), 24))

  const linkSnap = await adminDb.collection('booking_links').doc(booking.bookingLinkId).get()
  const link = { id: linkSnap.id, ...linkSnap.data() } as any

  const hostSnap = await adminDb.collection('hosts').doc(booking.hostId).get()
  const host = hostSnap.data()!

  return (
    <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        {/* Current booking */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Current booking</p>
          <p className="font-semibold text-gray-900">{link.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(meetingStart, 'EEEE, MMMM d, yyyy')} at {format(meetingStart, 'h:mm a')} · with {host.name}
          </p>
        </div>

        {pastDeadline ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-2">
            <p className="font-semibold text-gray-900">Deadline passed</p>
            <p className="text-sm text-gray-500">
              Rescheduling must be done at least 24 hours before the meeting.
              Please contact {host.name} at{' '}
              <a href={`mailto:${host.email}`} className="text-[#0D7377] underline">{host.email}</a>.
            </p>
          </div>
        ) : (
          <RescheduleWidget
            bookingId={id}
            token={token}
            link={link}
            currentStartTime={booking.startTime}
            language={booking.language}
          />
        )}
      </div>
    </main>
  )
}
