export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { deleteCalendarEvent, createCalendarEvent } from '@/lib/google/calendar'
import { Resend } from 'resend'
import { isBefore, addHours, addMinutes, parseISO } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { token, newStartTime } = await request.json()

  if (!newStartTime) {
    return NextResponse.json({ error: 'newStartTime is required' }, { status: 400 })
  }

  const bookingSnap = await adminDb.collection('bookings').doc(id).get()
  if (!bookingSnap.exists) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const booking = bookingSnap.data()!
  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'Booking is already cancelled or completed' }, { status: 409 })
  }

  // Auth: guest token OR logged-in host
  let rescheduledBy: 'guest' | 'host' = 'guest'
  if (token) {
    if (token !== booking.rescheduleToken) {
      return NextResponse.json({ error: 'Invalid reschedule token' }, { status: 403 })
    }
    // Guest: enforce 24h deadline on OLD slot
    const oldStart = parseISO(booking.startTime)
    if (isBefore(oldStart, addHours(new Date(), 24))) {
      return NextResponse.json({ error: 'Rescheduling must be done at least 24 hours before the meeting' }, { status: 409 })
    }
  } else {
    const user = await getServerUser()
    if (!user || user.uid !== booking.hostId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    rescheduledBy = 'host'
  }

  const linkSnap = await adminDb.collection('booking_links').doc(booking.bookingLinkId).get()
  const link = linkSnap.data()!

  const newStart = parseISO(newStartTime)
  const newEnd = addMinutes(newStart, link.durationMinutes)

  // Check new slot isn't already taken
  const conflictSnap = await adminDb
    .collection('bookings')
    .where('hostId', '==', booking.hostId)
    .where('startTime', '==', newStartTime)
    .where('status', '==', 'confirmed')
    .limit(1)
    .get()

  if (!conflictSnap.empty) {
    return NextResponse.json({ error: 'That slot is no longer available' }, { status: 409 })
  }

  const hostSnap = await adminDb.collection('hosts').doc(booking.hostId).get()
  const host = hostSnap.data()!

  // Delete old calendar event and create new one
  let newGoogleEventId: string | null = booking.googleEventId

  const calsSnap = await adminDb
    .collection('hosts').doc(booking.hostId)
    .collection('connected_calendars')
    .where('isActive', '==', true).limit(1).get()

  if (!calsSnap.empty) {
    const calData = calsSnap.docs[0].data()
    const cal = { id: calsSnap.docs[0].id, ...calData } as any

    if (booking.googleEventId) {
      await deleteCalendarEvent(cal, booking.googleEventId)
    }

    newGoogleEventId = await createCalendarEvent(cal, {
      title: `${link.title} — ${booking.customerName}`,
      description: booking.customerNotes
        ? `Meeting booked via CalRoute\n\nNotes: ${booking.customerNotes}`
        : 'Meeting booked via CalRoute',
      startTime: newStart,
      endTime: newEnd,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      hostEmail: host.email,
    })
  }

  // Update booking
  await bookingSnap.ref.update({
    startTime: newStart.toISOString(),
    endTime: newEnd.toISOString(),
    googleEventId: newGoogleEventId,
    previousStartTime: booking.startTime,
    rescheduledBy,
    rescheduledAt: new Date().toISOString(),
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const cancelUrl = `${appUrl}/booking/${id}/cancel?token=${booking.cancelToken}`
  const rescheduleUrl = `${appUrl}/booking/${id}/reschedule?token=${booking.rescheduleToken}`

  try {
    await Promise.all([
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: booking.customerEmail,
        subject: `Meeting rescheduled: ${link.title}`,
        html: `
          <h2>Your meeting has been rescheduled</h2>
          <ul>
            <li><strong>What:</strong> ${link.title}</li>
            <li><strong>New time:</strong> ${newStart.toLocaleString()}</li>
            <li><strong>With:</strong> ${host.name}</li>
          </ul>
          <p>Your calendar invite has been updated.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
          <p style="font-size:13px;color:#666">
            Need to change again? You can
            <a href="${rescheduleUrl}">reschedule</a> or
            <a href="${cancelUrl}">cancel</a> up to 24 hours before the meeting.
          </p>
        `,
      }),
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: host.email,
        subject: `Meeting rescheduled: ${booking.customerName} — ${link.title}`,
        html: `
          <h2>A meeting has been rescheduled</h2>
          <ul>
            <li><strong>Customer:</strong> ${booking.customerName} (${booking.customerEmail})</li>
            <li><strong>Meeting:</strong> ${link.title}</li>
            <li><strong>New time:</strong> ${newStart.toLocaleString()}</li>
            <li><strong>Previous time:</strong> ${new Date(booking.startTime).toLocaleString()}</li>
          </ul>
          <p>Your calendar has been updated.</p>
        `,
      }),
    ])
  } catch (e) {
    console.error('[reschedule] email failed:', e)
  }

  return NextResponse.json({ success: true, newStartTime: newStart.toISOString() })
}
