import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
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

  const supabase = await createServiceClient()

  // 1. Validate the slot reservation
  const { data: reservation } = await supabase
    .from('slot_reservations')
    .select('*')
    .eq('host_id', host_id)
    .eq('start_time', start_time)
    .eq('session_token', session_token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!reservation) {
    return NextResponse.json(
      { error: 'Slot reservation expired or invalid. Please select the slot again.' },
      { status: 409 }
    )
  }

  // 2. Load booking link
  const { data: link } = await supabase
    .from('booking_links')
    .select('*')
    .eq('id', reservation.booking_link_id)
    .single()

  if (!link) {
    return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
  }

  // 3. Load host info
  const { data: host } = await supabase
    .from('hosts')
    .select('*')
    .eq('id', host_id)
    .single()

  if (!host) {
    return NextResponse.json({ error: 'Host not found' }, { status: 404 })
  }

  // 4. Load host's primary calendar for event creation
  const { data: hostCalendar } = await supabase
    .from('connected_calendars')
    .select('*')
    .eq('host_id', host_id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const startTime = parseISO(start_time)
  const endTime = addMinutes(startTime, link.duration_minutes)

  // 5. Create booking in DB (unique constraint prevents double-booking)
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      booking_link_id: link.id,
      host_id,
      customer_name,
      customer_email,
      customer_notes: customer_notes ?? null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'confirmed',
    })
    .select()
    .single()

  if (bookingError) {
    if (bookingError.code === '23505') {
      return NextResponse.json(
        { error: 'This slot was just booked by someone else. Please choose another time.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }

  // 6. Create Google Calendar event
  let googleEventId: string | null = null
  if (hostCalendar) {
    googleEventId = await createCalendarEvent(hostCalendar, {
      title: `${link.title} — ${customer_name}`,
      description: customer_notes
        ? `Meeting booked via CalRoute\n\nNotes from customer: ${customer_notes}`
        : 'Meeting booked via CalRoute',
      startTime,
      endTime,
      customerEmail: customer_email,
      customerName: customer_name,
      hostEmail: host.email,
    })

    if (googleEventId) {
      await supabase
        .from('bookings')
        .update({ google_event_id: googleEventId })
        .eq('id', booking.id)
    }
  }

  // 7. Update last_booked_at for round-robin tracking
  await supabase
    .from('booking_link_hosts')
    .update({ last_booked_at: new Date().toISOString() })
    .eq('booking_link_id', link.id)
    .eq('host_id', host_id)

  // 8. Delete the reservation
  await supabase
    .from('slot_reservations')
    .delete()
    .eq('id', reservation.id)

  // 9. Send confirmation emails
  try {
    await Promise.all([
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: customer_email,
        subject: `Booking confirmed: ${link.title}`,
        html: buildCustomerConfirmationEmail({ booking: booking as any, link: link as any, host: host as any }),
      }),
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: host.email,
        subject: `New booking: ${customer_name} — ${link.title}`,
        html: buildHostNotificationEmail({ booking: booking as any, link: link as any, customer_name, customer_email, customer_notes }),
      }),
    ])
  } catch (emailError) {
    console.error('Failed to send confirmation emails:', emailError)
    // Don't fail the booking if email fails
  }

  return NextResponse.json({ booking_id: booking.id, status: 'confirmed' })
}

function buildCustomerConfirmationEmail(params: any): string {
  const { booking, link, host } = params
  const start = new Date(booking.start_time)
  return `
    <h2>Your meeting is confirmed!</h2>
    <p>You have a <strong>${link.duration_minutes}-minute</strong> meeting scheduled.</p>
    <ul>
      <li><strong>What:</strong> ${link.title}</li>
      <li><strong>When:</strong> ${start.toLocaleString()}</li>
      <li><strong>With:</strong> ${host.name}</li>
    </ul>
    <p>You'll receive a Google Meet link in your calendar invite.</p>
    <p>Need to cancel? Reply to this email.</p>
  `
}

function buildHostNotificationEmail(params: any): string {
  const { booking, link, customer_name, customer_email, customer_notes } = params
  const start = new Date(booking.start_time)
  return `
    <h2>New booking received</h2>
    <ul>
      <li><strong>Meeting:</strong> ${link.title}</li>
      <li><strong>When:</strong> ${start.toLocaleString()}</li>
      <li><strong>Customer:</strong> ${customer_name} (${customer_email})</li>
      ${customer_notes ? `<li><strong>Notes:</strong> ${customer_notes}</li>` : ''}
    </ul>
  `
}
