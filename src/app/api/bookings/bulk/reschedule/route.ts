export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { deleteCalendarEvent, createCalendarEvent } from '@/lib/google/calendar'
import { fireWebhooks } from '@/lib/webhooks'
import { Resend } from 'resend'
import { addMinutes, parseISO } from 'date-fns'
import { bookingRescheduledGuestEmail, bookingRescheduledHostEmail } from '@/lib/email-templates/booking-rescheduled'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookingIds, newStartTime } = await request.json() as {
    bookingIds: string[]
    newStartTime: string
  }

  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return NextResponse.json({ error: 'No booking IDs provided' }, { status: 400 })
  }

  if (!newStartTime) {
    return NextResponse.json({ error: 'newStartTime is required' }, { status: 400 })
  }

  const results = await Promise.all(
    bookingIds.map(async (id) => {
      try {
        const bookingSnap = await adminDb.collection('bookings').doc(id).get()
        if (!bookingSnap.exists || bookingSnap.data()!.hostId !== user.uid) {
          return { id, success: false, error: 'Not found or unauthorized' }
        }

        const booking = bookingSnap.data()!
        if (booking.status !== 'confirmed') {
          return { id, success: false, error: 'Not confirmed' }
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
          .get()

        const hasConflict = conflictSnap.docs.some(d => d.id !== id)
        if (hasConflict) {
          return { id, success: false, error: 'Slot already booked' }
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

          // Update lastSyncedAt to track real-time sync
          await adminDb
            .collection('hosts').doc(booking.hostId)
            .collection('connected_calendars')
            .doc(calsSnap.docs[0].id)
            .update({ lastSyncedAt: new Date().toISOString() })
        }

        // Update booking
        await bookingSnap.ref.update({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          googleEventId: newGoogleEventId,
          previousStartTime: booking.startTime,
          rescheduledBy: 'host',
          rescheduledAt: new Date().toISOString(),
        })

        const appUrl = process.env.NEXT_PUBLIC_APP_URL
        const cancelUrl = `${appUrl}/booking/${id}/cancel?token=${booking.cancelToken}`
        const rescheduleUrl = `${appUrl}/booking/${id}/reschedule?token=${booking.rescheduleToken}`

        try {
          const guestHtml = bookingRescheduledGuestEmail({
            title: link.title,
            hostName: host.name,
            newStartTime: newStart,
            durationMinutes: link.durationMinutes,
            timezone: booking.timezone ?? 'UTC',
            rescheduleUrl,
            cancelUrl,
          })

          const hostHtml = bookingRescheduledHostEmail({
            title: link.title,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            newStartTime: newStart,
            previousStartTime: parseISO(booking.startTime),
            timezone: booking.timezone ?? 'UTC',
          })

          await Promise.all([
            resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL!,
              to: booking.customerEmail,
              subject: `Meeting rescheduled: ${link.title}`,
              html: guestHtml,
            }),
            resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL!,
              to: host.email,
              subject: `Meeting rescheduled: ${booking.customerName} — ${link.title}`,
              html: hostHtml,
            }),
          ])
        } catch (e) {
          console.error('[bulk-reschedule] email failed:', e)
        }

        // Fire webhook
        await fireWebhooks(booking.hostId, 'booking.rescheduled', {
          booking_id: id,
          customer_name: booking.customerName,
          customer_email: booking.customerEmail,
          new_start_time: newStart.toISOString(),
          previous_start_time: booking.startTime,
        })

        return { id, success: true }
      } catch (error) {
        console.error('[bulk-reschedule] error:', error)
        return { id, success: false, error: String(error) }
      }
    })
  )

  const successful = results.filter(r => r.success).length
  return NextResponse.json({ successful, results })
}
