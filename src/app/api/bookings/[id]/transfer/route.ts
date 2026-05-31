export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { deleteCalendarEvent, createCalendarEvent } from '@/lib/google/calendar'
import { Resend } from 'resend'
import { parseISO, addMinutes } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { newHostId } = await request.json()
  if (!newHostId) return NextResponse.json({ error: 'newHostId is required' }, { status: 400 })

  const bookingSnap = await adminDb.collection('bookings').doc(id).get()
  if (!bookingSnap.exists) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const booking = bookingSnap.data()!
  if (booking.status !== 'confirmed') return NextResponse.json({ error: 'Booking is not active' }, { status: 409 })
  if (booking.hostId !== user.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (newHostId === user.uid) return NextResponse.json({ error: 'Already assigned to you' }, { status: 400 })

  // Verify new host is on the same booking link
  const newHostMemberSnap = await adminDb
    .collection('booking_links').doc(booking.bookingLinkId)
    .collection('hosts').doc(newHostId).get()
  if (!newHostMemberSnap.exists) {
    return NextResponse.json({ error: 'That person is not a host on this link' }, { status: 400 })
  }

  const [linkSnap, oldHostSnap, newHostSnap] = await Promise.all([
    adminDb.collection('booking_links').doc(booking.bookingLinkId).get(),
    adminDb.collection('hosts').doc(booking.hostId).get(),
    adminDb.collection('hosts').doc(newHostId).get(),
  ])
  const link = linkSnap.data()!
  const oldHost = oldHostSnap.data()!
  const newHost = newHostSnap.data()!

  const startTime = parseISO(booking.startTime)
  const endTime = addMinutes(startTime, link.durationMinutes)

  // Remove calendar event from old host
  if (booking.googleEventId) {
    const oldCalSnap = await adminDb
      .collection('hosts').doc(booking.hostId)
      .collection('connected_calendars')
      .where('isActive', '==', true).limit(1).get()
    if (!oldCalSnap.empty) {
      await deleteCalendarEvent({ id: oldCalSnap.docs[0].id, ...oldCalSnap.docs[0].data() } as any, booking.googleEventId)
    }
  }

  // Create calendar event on new host
  let newGoogleEventId: string | null = null
  const newCalSnap = await adminDb
    .collection('hosts').doc(newHostId)
    .collection('connected_calendars')
    .where('isActive', '==', true).limit(1).get()
  if (!newCalSnap.empty) {
    newGoogleEventId = await createCalendarEvent(
      { id: newCalSnap.docs[0].id, ...newCalSnap.docs[0].data() } as any,
      {
        title: `${link.title} — ${booking.customerName}`,
        description: booking.customerNotes
          ? `Meeting booked via CalRoute\n\nNotes: ${booking.customerNotes}`
          : 'Meeting booked via CalRoute',
        startTime,
        endTime,
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        hostEmail: newHost.email,
      }
    )
  }

  // Update booking
  await bookingSnap.ref.update({
    hostId: newHostId,
    googleEventId: newGoogleEventId,
    transferredFrom: booking.hostId,
    transferredAt: new Date().toISOString(),
  })

  // Notify everyone
  try {
    await Promise.all([
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: newHost.email,
        subject: `Booking transferred to you: ${booking.customerName} — ${link.title}`,
        html: `<h2>A booking has been transferred to you</h2>
          <ul>
            <li><strong>Customer:</strong> ${booking.customerName} (${booking.customerEmail})</li>
            <li><strong>Meeting:</strong> ${link.title}</li>
            <li><strong>When:</strong> ${startTime.toLocaleString()}</li>
            <li><strong>Transferred by:</strong> ${oldHost.name}</li>
          </ul>
          <p>Check your calendar for the invite.</p>`,
      }),
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: booking.customerEmail,
        subject: `Meeting update: ${link.title}`,
        html: `<h2>Your meeting host has changed</h2>
          <p>Your meeting <strong>${link.title}</strong> on ${startTime.toLocaleString()} will now be with <strong>${newHost.name}</strong>.</p>
          <p>Your calendar invite has been updated.</p>`,
      }),
    ])
  } catch (e) {
    console.error('[transfer] email failed:', e)
  }

  return NextResponse.json({ success: true })
}
