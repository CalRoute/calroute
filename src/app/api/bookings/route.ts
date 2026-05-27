import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { createCalendarEvent } from '@/lib/google/calendar'
import { addMinutes, parseISO } from 'date-fns'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { slug, start_time, host_id, session_token, customer_name, customer_email, customer_notes } = body

  if (!slug || !start_time || !host_id || !session_token || !customer_name || !customer_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 1. Validate slot reservation
  const reservationSnap = await adminDb
    .collection('slot_reservations')
    .where('hostId', '==', host_id)
    .where('startTime', '==', start_time)
    .where('sessionToken', '==', session_token)
    .where('expiresAt', '>=', new Date().toISOString())
    .limit(1)
    .get()

  if (reservationSnap.empty) {
    return NextResponse.json(
      { error: 'Slot reservation expired or invalid. Please select the slot again.' },
      { status: 409 }
    )
  }

  // 2. Load booking link
  const linksSnap = await adminDb
    .collection('booking_links')
    .where('slug', '==', slug)
    .limit(1)
    .get()

  if (linksSnap.empty) {
    return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
  }

  const link = { id: linksSnap.docs[0].id, ...linksSnap.docs[0].data() } as any

  // 3. Load host
  const hostSnap = await adminDb.collection('hosts').doc(host_id).get()
  if (!hostSnap.exists) {
    return NextResponse.json({ error: 'Host not found' }, { status: 404 })
  }
  const host = hostSnap.data() as any

  // 4. Check for double-booking
  const startTime = parseISO(start_time)
  const endTime = addMinutes(startTime, link.durationMinutes)

  const existingSnap = await adminDb
    .collection('bookings')
    .where('hostId', '==', host_id)
    .where('startTime', '==', start_time)
    .where('status', '==', 'confirmed')
    .limit(1)
    .get()

  if (!existingSnap.empty) {
    return NextResponse.json(
      { error: 'This slot was just booked by someone else. Please choose another time.' },
      { status: 409 }
    )
  }

  // 5. Create booking document
  const bookingRef = adminDb.collection('bookings').doc()
  await bookingRef.set({
    bookingLinkId: link.id,
    hostId: host_id,
    customerName: customer_name,
    customerEmail: customer_email,
    customerNotes: customer_notes ?? null,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    googleEventId: null,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  })

  // 6. Load host calendar and create Google Calendar event
  const calsSnap = await adminDb
    .collection('hosts')
    .doc(host_id)
    .collection('connected_calendars')
    .where('isActive', '==', true)
    .limit(1)
    .get()

  if (!calsSnap.empty) {
    const calData = calsSnap.docs[0].data()
    const hostCalendar = {
      id: calsSnap.docs[0].id,
      provider: calData.provider,
      accountEmail: calData.accountEmail,
      calendarId: calData.calendarId,
      label: calData.label,
      accessToken: calData.accessToken,
      refreshToken: calData.refreshToken,
      expiresAt: calData.expiresAt,
      isActive: calData.isActive,
      createdAt: calData.createdAt,
    }

    const googleEventId = await createCalendarEvent(hostCalendar, {
      title: `${link.title} — ${customer_name}`,
      description: customer_notes
        ? `Meeting booked via CalRoute\n\nNotes: ${customer_notes}`
        : 'Meeting booked via CalRoute',
      startTime,
      endTime,
      customerEmail: customer_email,
      customerName: customer_name,
      hostEmail: host.email,
    })

    if (googleEventId) {
      await bookingRef.update({ googleEventId })
    }
  }

  // 7. Update last_booked_at for round-robin
  await adminDb
    .collection('booking_links')
    .doc(link.id)
    .collection('hosts')
    .doc(host_id)
    .update({ lastBookedAt: new Date().toISOString() })

  // 8. Delete reservation
  await reservationSnap.docs[0].ref.delete()

  // 9. Send emails
  try {
    await Promise.all([
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: customer_email,
        subject: `Booking confirmed: ${link.title}`,
        html: `
          <h2>Your meeting is confirmed!</h2>
          <ul>
            <li><strong>What:</strong> ${link.title}</li>
            <li><strong>When:</strong> ${startTime.toLocaleString()}</li>
            <li><strong>With:</strong> ${host.name}</li>
          </ul>
          <p>A Google Meet link is in your calendar invite.</p>
        `,
      }),
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: host.email,
        subject: `New booking: ${customer_name} — ${link.title}`,
        html: `
          <h2>New booking received</h2>
          <ul>
            <li><strong>Meeting:</strong> ${link.title}</li>
            <li><strong>When:</strong> ${startTime.toLocaleString()}</li>
            <li><strong>Customer:</strong> ${customer_name} (${customer_email})</li>
            ${customer_notes ? `<li><strong>Notes:</strong> ${customer_notes}</li>` : ''}
          </ul>
        `,
      }),
    ])
  } catch (emailError) {
    console.error('Email failed:', emailError)
  }

  return NextResponse.json({ booking_id: bookingRef.id, status: 'confirmed' })
}
