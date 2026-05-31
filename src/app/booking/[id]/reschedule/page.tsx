export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'
import { format, parseISO, isBefore, addHours } from 'date-fns'
import PageHeader from '@/components/PageHeader'
import PageFooter from '@/components/PageFooter'
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
      <>
        <PageHeader />
        <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4v2" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">Invalid link</p>
            <p className="text-sm text-gray-500 mt-2">This reschedule link is not valid or has expired.</p>
          </div>
        </main>
        <PageFooter />
      </>
    )
  }

  if (booking.status === 'cancelled') {
    return (
      <>
        <PageHeader />
        <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 max-w-md w-full text-center space-y-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">Booking cancelled</p>
            <p className="text-sm text-gray-500">This booking has already been cancelled and cannot be rescheduled.</p>
          </div>
        </main>
        <PageFooter />
      </>
    )
  }

  const meetingStart = parseISO(booking.startTime)
  const pastDeadline = isBefore(meetingStart, addHours(new Date(), 24))

  const linkSnap = await adminDb.collection('booking_links').doc(booking.bookingLinkId).get()
  const link = { id: linkSnap.id, ...linkSnap.data() } as any

  const hostSnap = await adminDb.collection('hosts').doc(booking.hostId).get()
  const host = hostSnap.data()!

  return (
    <>
      <PageHeader />
      <main className="min-h-screen bg-[#F7F4EF]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="space-y-4">
            {/* Current booking */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Current booking</p>
              <p className="font-semibold text-gray-900 text-lg">{link.title}</p>
              <p className="text-sm text-gray-500 mt-2">
                {format(meetingStart, 'EEEE, MMMM d, yyyy')} at {format(meetingStart, 'h:mm a')} · {link.durationMinutes} min
              </p>
              <p className="text-sm text-gray-500 mt-1">with {host.name}</p>
            </div>

            {pastDeadline ? (
              <div className="bg-white rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center space-y-2">
                <p className="font-semibold text-gray-900">24-hour deadline passed</p>
                <p className="text-sm text-gray-600">
                  Rescheduling must be done at least 24 hours before the meeting.
                  Please contact {host.name} at{' '}
                  <a href={`mailto:${host.email}`} className="text-[#0D7377] underline font-medium">{host.email}</a>.
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
        </div>
      </main>
      <PageFooter />
    </>
  )
}
