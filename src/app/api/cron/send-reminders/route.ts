export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { Resend } from 'resend'
import { bookingReminderGuestEmail, bookingReminderHostEmail } from '@/lib/email-templates/booking-reminder'
import { trialEndingEmail } from '@/lib/email-templates/trial-ending'
import { vacationEndedEmail } from '@/lib/email-templates/vacation-set'
import { parseISO } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setHours(windowStart.getHours() + 23)
  const windowEnd = new Date(now)
  windowEnd.setHours(windowEnd.getHours() + 25)

  try {
    const bookingsSnap = await adminDb
      .collection('bookings')
      .where('status', '==', 'confirmed')
      .get()

    const upcoming = bookingsSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(b => {
        const start = new Date(b.startTime).getTime()
        return start >= windowStart.getTime() && start < windowEnd.getTime()
      })

    let sent = 0

    for (const booking of upcoming) {
      // Skip if reminder already sent
      if (booking.reminderSentAt) continue

      const [linkSnap, hostSnap] = await Promise.all([
        adminDb.collection('booking_links').doc(booking.bookingLinkId).get(),
        adminDb.collection('hosts').doc(booking.hostId).get(),
      ])

      const link = linkSnap.data()
      const host = hostSnap.data()
      if (!link || !host) continue

      const startTime = parseISO(booking.startTime)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!
      const cancelUrl = `${appUrl}/booking/${booking.id}/cancel?token=${booking.cancelToken}`
      const rescheduleUrl = `${appUrl}/booking/${booking.id}/reschedule?token=${booking.rescheduleToken}`

      await Promise.allSettled([
        resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: booking.customerEmail,
          subject: `Reminder: ${link.title} is tomorrow`,
          html: bookingReminderGuestEmail({
            title: link.title,
            hostName: host.name,
            startTime,
            durationMinutes: link.durationMinutes,
            timezone: booking.timezone ?? 'UTC',
            meetingType: link.meetingType,
            meetLink: booking.meetLink ?? null,
            meetingLocation: link.meetingLocation ?? undefined,
            cancelUrl,
            rescheduleUrl,
          }),
        }),
        resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: host.email,
          subject: `Reminder: ${link.title} with ${booking.customerName} is tomorrow`,
          html: bookingReminderHostEmail({
            title: link.title,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            startTime,
            durationMinutes: link.durationMinutes,
            timezone: booking.timezone ?? 'UTC',
            meetingType: link.meetingType,
            meetLink: booking.meetLink ?? null,
            meetingLocation: link.meetingLocation ?? undefined,
          }),
        }),
      ])

      // Mark reminder sent so we don't double-send
      await adminDb.collection('bookings').doc(booking.id).update({
        reminderSentAt: new Date().toISOString(),
      })

      sent++
    }

    // ── Vacation ended notifications ───────────────────────────
    // Find hosts whose most recent blackout period ended yesterday
    const todayStr = now.toISOString().split('T')[0]
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const allHostsSnap = await adminDb.collection('hosts').get()
    for (const hostDoc of allHostsSnap.docs) {
      const host = hostDoc.data()
      if (!host.email) continue

      const blackoutsSnap = await adminDb
        .collection('hosts').doc(hostDoc.id)
        .collection('blackout_dates').get()

      const endedYesterday = blackoutsSnap.docs
        .map(d => d.data())
        .some(d => d.endDate === yesterdayStr)

      if (!endedYesterday) continue

      // Make sure no other blackout is still active today
      const stillBlocked = blackoutsSnap.docs
        .map(d => d.data())
        .some(d => d.startDate <= todayStr && d.endDate >= todayStr)

      if (stillBlocked) continue

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: host.email,
        subject: "You're back! CalRoute is open for bookings again.",
        html: vacationEndedEmail({
          name: host.name ?? 'there',
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        }),
      }).catch(e => console.error('[vacation-ended] failed:', e))
    }

    // ── Trial expiry warnings ──────────────────────────────────
    // Warn users on free_trial (no paid billing doc) at 3 days and 1 day left
    // assuming a 30-day trial from createdAt
    const TRIAL_DAYS = 30
    const WARN_AT = [3, 1] // days before expiry

    const hostsSnap = await adminDb.collection('hosts').get()
    for (const hostDoc of hostsSnap.docs) {
      const host = hostDoc.data()
      if (!host.createdAt || !host.email) continue

      const billingSnap = await adminDb.collection('hosts').doc(hostDoc.id).collection('billing').doc('status').get()
      const billing = billingSnap.data()
      const tier = billing?.tier ?? 'free_trial'

      // Only warn free trial users who haven't upgraded or are VIP
      if (tier !== 'free_trial') continue

      const createdAt = new Date(host.createdAt)
      const trialEndsAt = new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
      const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000)

      if (WARN_AT.includes(daysLeft)) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: host.email,
          subject: `Your CalRoute trial ${daysLeft === 1 ? 'expires today' : `expires in ${daysLeft} days`}`,
          html: trialEndingEmail({
            name: host.name ?? 'there',
            daysLeft,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
        }).catch(e => console.error('[trial-warning] failed:', e))
      }
    }

    return NextResponse.json({ ok: true, sent, checked: upcoming.length })
  } catch (error) {
    console.error('[cron/reminders] error:', error)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
