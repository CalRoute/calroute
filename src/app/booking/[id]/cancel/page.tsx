export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'
import { format, parseISO, isBefore, addHours } from 'date-fns'
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
      <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-medium">Invalid cancellation link.</p>
        </div>
      </main>
    )
  }

  if (booking.status === 'cancelled') {
    return (
      <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center space-y-2">
          <p className="font-semibold text-gray-900">Already cancelled</p>
          <p className="text-sm text-gray-500">This booking has already been cancelled.</p>
        </div>
      </main>
    )
  }

  const meetingStart = parseISO(booking.startTime)
  const pastDeadline = isBefore(meetingStart, addHours(new Date(), 24))

  const linkSnap = await adminDb.collection('booking_links').doc(booking.bookingLinkId).get()
  const link = linkSnap.data()!

  const hostSnap = await adminDb.collection('hosts').doc(booking.hostId).get()
  const host = hostSnap.data()!

  return (
    <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 max-w-md w-full space-y-6">
        <div className="h-1 bg-red-400 rounded-full -mt-8 -mx-8 mb-6" />

        <div>
          <h1 className="text-xl font-bold text-gray-900">Cancel meeting</h1>
          <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 border border-gray-100">
          <p className="font-semibold text-gray-900">{link.title}</p>
          <p className="text-sm text-gray-600">{format(meetingStart, 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-sm text-gray-600">{format(meetingStart, 'h:mm a')} · {link.durationMinutes} min</p>
          <p className="text-sm text-gray-500">with {host.name}</p>
        </div>

        {pastDeadline ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            Cancellations must be made at least 24 hours before the meeting. Please contact {host.name} directly at{' '}
            <a href={`mailto:${host.email}`} className="underline">{host.email}</a>.
          </div>
        ) : (
          <CancelButton bookingId={id} token={token} />
        )}
      </div>
    </main>
  )
}
