export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { deleteCalendarEvent } from '@/lib/google/calendar'
import { fireWebhooks } from '@/lib/webhooks'
import { Resend } from 'resend'
import { parseISO } from 'date-fns'
import { bookingCancelledGuestEmail, bookingCancelledHostEmail } from '@/lib/email-templates/booking-cancelled'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { bookingIds } = await request.json() as { bookingIds: string[] }

  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return NextResponse.json({ error: 'No booking IDs provided' }, { status: 400 })
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
          return { id, success: false, error: 'Already cancelled' }
        }

        // Mark cancelled
        await bookingSnap.ref.update({
          status: 'cancelled',
          cancelledBy: 'host',
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
            cancelledBy: 'host',
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
          console.error('[bulk-cancel] email failed:', e)
        }

        // Fire webhook
        await fireWebhooks(booking.hostId, 'booking.cancelled', {
          booking_id: id,
          customer_name: booking.customerName,
          customer_email: booking.customerEmail,
          cancelled_at: new Date().toISOString(),
        })

        return { id, success: true }
      } catch (error) {
        console.error('[bulk-cancel] error:', error)
        return { id, success: false, error: String(error) }
      }
    })
  )

  const successful = results.filter(r => r.success).length
  return NextResponse.json({ successful, results })
}
