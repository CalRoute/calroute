export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifySchedulingAccess } from '@/lib/billing/verify-scheduling-access'
import { addMinutes, parseISO } from 'date-fns'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
  const body = await request.json()
  const { booking_link_id, host_id, start_time, duration_minutes } = body

  if (!booking_link_id || !host_id || !start_time || !duration_minutes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Load booking link to get owner
  const linkSnap = await adminDb.collection('booking_links').doc(booking_link_id).get()
  if (!linkSnap.exists) {
    return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
  }

  const link = linkSnap.data() as any

  // Verify billing access
  const linkHostsCountSnap = await adminDb
    .collection('booking_links')
    .doc(booking_link_id)
    .collection('hosts')
    .limit(2)
    .get()

  const isTeam = linkHostsCountSnap.size > 1
  const access = await verifySchedulingAccess(link.ownerId, isTeam)

  if (!access.allowed) {
    return NextResponse.json({ error: access.code }, { status: 402 })
  }

  const sessionToken = crypto.randomBytes(32).toString('hex')
  const startTime = parseISO(start_time)
  const endTime = addMinutes(startTime, duration_minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  // Clean up expired reservations for this host+slot
  const expiredSnap = await adminDb
    .collection('slot_reservations')
    .where('hostId', '==', host_id)
    .where('startTime', '==', start_time)
    .where('expiresAt', '<', new Date().toISOString())
    .get()

  const batch = adminDb.batch()
  expiredSnap.docs.forEach(d => batch.delete(d.ref))

  // Check for active reservation
  const activeSnap = await adminDb
    .collection('slot_reservations')
    .where('hostId', '==', host_id)
    .where('startTime', '==', start_time)
    .where('expiresAt', '>=', new Date().toISOString())
    .limit(1)
    .get()

  if (!activeSnap.empty) {
    await batch.commit()
    return NextResponse.json(
      { error: 'This slot is currently being reserved by another user.' },
      { status: 409 }
    )
  }

  // Create reservation
  const reservationRef = adminDb.collection('slot_reservations').doc()
  batch.set(reservationRef, {
    bookingLinkId: booking_link_id,
    hostId: host_id,
    startTime: start_time,
    endTime: endTime.toISOString(),
    sessionToken,
    expiresAt: expiresAt.toISOString(),
  })

  await batch.commit()

  return NextResponse.json({ session_token: sessionToken, expires_in_seconds: 300 })
  } catch (err) {
    console.error('[/api/slots/reserve]', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}
