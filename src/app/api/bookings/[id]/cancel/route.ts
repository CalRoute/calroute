export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { deleteCalendarEvent } from '@/lib/google/calendar'
import { Resend } from 'resend'
import { isBefore, addHours, parseISO } from 'date-fns'
import { bookingCancelledGuestEmail, bookingCancelledHostEmail } from '@/lib/email-templates/booking-cancelled'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { token } = await request.json()

  const bookingSnap = await adminDb.collection('bookings').doc(id).get()
  if (!bookingSnap.exists) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const booking = bookingSnap.data()!
  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'Booking is already cancelled or completed' }, { status: 409 })
  }

  // Auth: guest token OR logged-in host
  let cancelledBy: 'guest' | 'host' = 'guest'
  if (token) {
    if (token !== booking.cancelToken) {
      return NextResponse.json({ error: 'Invalid cancellation token' }, { status: 403 })
    }
    // Guest: enforce 24h deadline
    const meetingStart = parseISO(booking.startTime)
    if (isBefore(meetingStart, addHours(new Date(), 24))) {
      return NextResponse.json({ error: 'Cancellations must be made at least 24 hours before the meeting' }, { status: 409 })
    }
  } else {
    const user = await getServerUser()
    if (!user || user.uid !== booking.hostId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    cancelledBy = 'host'
  }

  // Mark cancelled
  await bookingSnap.ref.update({
    status: 'cancelled',
    cancelledBy,
    cancelledAt: new Date().toISOString(),
  })

  // Remove Google Calendar event
  if (booking.googleEventId) {
    const calsSnap = await adminDb
      .collection('hosts').doc(booking.hostId)
      .collection('connected_calendars')
      .where('isActive', '==', true).limit(1).get()

    if (!calsSnap.empty) {
      const calData = calsSnap.docs[0].data()
      await deleteCalendarEvent({ id: calsSnap.docs[0].id, ...calData } as any, booking.googleEventId)
    }
  }

  // Load host + link for emails
  const [hostSnap, linkSnap] = await Promise.all([
    adminDb.collection('hosts').doc(booking.hostId).get(),
    adminDb.collection('booking_links').doc(booking.bookingLinkId).get(),
  ])
  const host = hostSnap.data()!
  const link = linkSnap.data()!

  try {
    const guestHtml = bookingCancelledGuestEmail({
      title: link.title,
      startTime: parseISO(booking.startTime),
      timezone: booking.timezone ?? 'UTC',
    })

    const hostHtml = bookingCancelledHostEmail({
      title: link.title,
      customerName: booking.customerName,
      startTime: parseISO(booking.startTime),
      timezone: booking.timezone ?? 'UTC',
      cancelledBy,
    })

    await Promise.all([
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: booking.customerEmail,
        subject: `Booking cancelled: ${link.title}`,
        html: guestHtml,
      }),
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: host.email,
        subject: `Booking cancelled: ${booking.customerName} — ${link.title}`,
        html: hostHtml,
      }),
    ])
  } catch (e) {
    console.error('[cancel] email failed:', e)
  }

  return NextResponse.json({ success: true })
}
