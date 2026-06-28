export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { deleteCalendarEvent } from '@/lib/google/calendar'
import { Resend } from 'resend'
import { isBefore, addHours, parseISO } from 'date-fns'
import { bookingCancelledGuestEmail, bookingCancelledHostEmail } from '@/lib/email-templates/booking-cancelled'
import { renderCustomTemplate } from '@/lib/email-templates/render-custom'
import { fireWebhooks } from '@/lib/webhooks'
import { logEmailDelivery } from '@/lib/email-logger'

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

      // Update lastSyncedAt to track real-time sync
      await adminDb
        .collection('hosts').doc(booking.hostId)
        .collection('connected_calendars')
        .doc(calsSnap.docs[0].id)
        .update({ lastSyncedAt: new Date().toISOString() })
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
    const customTemplates = link.emailTemplates ?? {}
    const startTimeStr = parseISO(booking.startTime).toLocaleString()

    const guestHtml = customTemplates.cancelled
      ? renderCustomTemplate(customTemplates.cancelled, {
          title: link.title,
          startTime: startTimeStr,
        })
      : bookingCancelledGuestEmail({
          title: link.title,
          startTime: parseISO(booking.startTime),
          timezone: booking.timezone ?? 'UTC',
        })

    const hostHtml = customTemplates.cancelled
      ? renderCustomTemplate(customTemplates.cancelled, {
          title: link.title,
          customerName: booking.customerName,
          startTime: startTimeStr,
          cancelledBy,
        })
      : bookingCancelledHostEmail({
          title: link.title,
          customerName: booking.customerName,
          startTime: parseISO(booking.startTime),
          timezone: booking.timezone ?? 'UTC',
          cancelledBy,
        })

    const [guestResult, hostResult] = await Promise.allSettled([
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
    logEmailDelivery({ type: 'booking_cancelled', to: booking.customerEmail, subject: `Booking cancelled: ${link.title}`, success: guestResult.status === 'fulfilled', error: guestResult.status === 'rejected' ? String(guestResult.reason) : undefined })
    logEmailDelivery({ type: 'booking_cancelled', to: host.email, subject: `Booking cancelled: ${booking.customerName} — ${link.title}`, success: hostResult.status === 'fulfilled', error: hostResult.status === 'rejected' ? String(hostResult.reason) : undefined })
  } catch (e) {
    console.error('[cancel] email failed:', e)
  }

  // Fire webhooks
  fireWebhooks(booking.hostId, 'booking.cancelled', {
    booking_id: id,
    customer_name: booking.customerName,
    customer_email: booking.customerEmail,
    cancelled_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
