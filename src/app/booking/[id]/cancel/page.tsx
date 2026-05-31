export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'
import { format, parseISO, isBefore, addHours } from 'date-fns'
import PageHeader from '@/components/PageHeader'
import PageFooter from '@/components/PageFooter'
import CancelButton from './CancelButton'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function CancelPage({ params, searchParams }: Props) {
  const { id } = await params
  const { token } = await searchParams

  const bookingSnap = await adminDb.collection('bookings').doc(id).get()
  if (!bookingSnap.exists) notFound()

  const booking = bookingSnap.data()!

  if (!token || token !== booking.cancelToken) {
    return (
      <>
        <PageHeader />
        <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7m0 6h0" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">Invalid link</p>
            <p className="text-sm text-gray-500 mt-2">This cancellation link is not valid or has expired.</p>
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
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">Already cancelled</p>
            <p className="text-sm text-gray-500">This booking has already been cancelled.</p>
          </div>
        </main>
        <PageFooter />
      </>
    )
  }

  const meetingStart = parseISO(booking.startTime)
  const pastDeadline = isBefore(meetingStart, addHours(new Date(), 24))

  const linkSnap = await adminDb.collection('booking_links').doc(booking.bookingLinkId).get()
  const link = linkSnap.data()!

  const hostSnap = await adminDb.collection('hosts').doc(booking.hostId).get()
  const host = hostSnap.data()!

  return (
    <>
      <PageHeader />
      <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 max-w-md w-full space-y-6">
          <div className="h-1 bg-red-400 rounded-full -mt-8 -mx-8 mb-6" />

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cancel meeting</h1>
            <p className="text-sm text-gray-500 mt-2">This action cannot be undone. Both you and the host will be notified.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 border border-gray-100">
            <p className="font-semibold text-gray-900">{link.title}</p>
            <p className="text-sm text-gray-600">{format(meetingStart, 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-sm text-gray-600">{format(meetingStart, 'h:mm a')} · {link.durationMinutes} min</p>
            <p className="text-sm text-gray-500">with {host.name}</p>
          </div>

          {pastDeadline ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm space-y-2">
              <p className="font-medium">24-hour deadline passed</p>
              <p>Cancellations must be made at least 24 hours before the meeting. Please contact {host.name} directly at{' '}
                <a href={`mailto:${host.email}`} className="underline font-medium">{host.email}</a>.
              </p>
            </div>
          ) : (
            <CancelButton bookingId={id} token={token} />
          )}
        </div>
      </main>
      <PageFooter />
    </>
  )
}
