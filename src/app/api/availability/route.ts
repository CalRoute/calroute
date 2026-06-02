export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { queryFreeBusy } from '@/lib/google/calendar'
import { computeAvailableSlots } from '@/lib/scheduling/engine'
import { verifySchedulingAccess } from '@/lib/billing/verify-scheduling-access'
import { addDays, startOfDay, endOfDay, parseISO } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    return await handleAvailability(request)
  } catch (e: any) {
    console.error('[availability] unhandled error:', e)
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}

async function handleAvailability(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const startDateParam = searchParams.get('start')
  const timezone = searchParams.get('timezone') ?? 'UTC'
  const language = searchParams.get('language') ?? null
  const guestTimezone = searchParams.get('guest_timezone') ?? undefined

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  // 1. Load booking link by slug
  const linksSnap = await adminDb
    .collection('booking_links')
    .where('slug', '==', slug)
    .where('isActive', '==', true)
    .limit(1)
    .get()

  if (linksSnap.empty) {
    return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
  }

  const linkDoc = linksSnap.docs[0]
  const link = { id: linkDoc.id, ...linkDoc.data() } as any

  // 1b. Verify billing access for this link
  const linkHostsCountSnap = await adminDb
    .collection('booking_links')
    .doc(linkDoc.id)
    .collection('hosts')
    .limit(2)
    .get()

  const isTeam = linkHostsCountSnap.size > 1
  const access = await verifySchedulingAccess(link.ownerId, isTeam)

  if (!access.allowed) {
    return NextResponse.json({ error: access.code }, { status: 402 })
  }

  // 2. Determine date range
  const startDate = startDateParam
    ? startOfDay(parseISO(startDateParam))
    : startOfDay(new Date())
  const endDate = endOfDay(addDays(startDate, Math.min(link.maxDaysAhead ?? 30, 14)))

  // 3. Load booking_link_hosts subcollection
  const linkHostsSnap = await adminDb
    .collection('booking_links')
    .doc(linkDoc.id)
    .collection('hosts')
    .get()

  if (linkHostsSnap.empty) {
    return NextResponse.json({ slots: [] })
  }

  // 4. Load each host's data
  const hostsData = await Promise.all(
    linkHostsSnap.docs.map(async (lhDoc) => {
      const lhData = lhDoc.data()
      const hostId = lhData.hostId

      const [hostSnap, availSnap, calsSnap] = await Promise.all([
        adminDb.collection('hosts').doc(hostId).get(),
        adminDb.collection('hosts').doc(hostId).collection('availability').get(),
        adminDb.collection('hosts').doc(hostId).collection('connected_calendars')
          .where('isActive', '==', true).get(),
      ])

      return {
        hostId,
        priority: lhData.priority ?? 1,
        lastBookedAt: lhData.lastBookedAt ?? null,
        host: hostSnap.data(),
        availability: availSnap.docs.map(d => d.data()),
        calendars: calsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      }
    })
  )

  // 4b. Filter by language if requested
  const filteredHostsData = language
    ? hostsData.filter(h => {
        const langs: string[] = h.host?.languages ?? []
        return langs.includes(language)
      })
    : hostsData

  if (filteredHostsData.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  // 4c. Check for outdated calendar syncs
  const outdatedCalendars: string[] = []
  const OUTDATED_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours
  const now = Date.now()

  for (const h of filteredHostsData) {
    for (const cal of h.calendars as any[]) {
      const lastSyncTime = cal.lastSyncedAt ? new Date(cal.lastSyncedAt).getTime() : 0
      const timeSinceSync = now - lastSyncTime

      if (timeSinceSync > OUTDATED_THRESHOLD_MS) {
        outdatedCalendars.push(`${h.host?.name || h.hostId} (${cal.accountEmail})`)
      }
    }
  }

  // 5. Fetch freeBusy for all calendars
  const allCalendars = filteredHostsData.flatMap(h =>
    h.calendars.map((c: any) => ({
      ...c,
      host_id: h.hostId,
      account_email: c.accountEmail,
      calendar_id: c.calendarId,
      access_token: c.accessToken,
      refresh_token: c.refreshToken,
      expires_at: c.expiresAt,
      is_active: c.isActive,
      created_at: c.createdAt,
    }))
  )

  // 5a. Query Google Calendar for busy times (with error handling)
  let busyByCalendarId: Map<string, any[]>
  let googleCalendarWarning: string | null = null

  try {
    busyByCalendarId = await queryFreeBusy(
      allCalendars,
      startDate,
      endDate,
      async (calendarDocId, token, expiresAt) => {
        for (const h of filteredHostsData) {
          const cal = h.calendars.find((c: any) => c.id === calendarDocId)
          if (cal) {
            await adminDb
              .collection('hosts')
              .doc(h.hostId)
              .collection('connected_calendars')
              .doc(calendarDocId)
              .update({ accessToken: token, expiresAt: expiresAt.toISOString() })
            break
          }
        }
      }
    )
  } catch (error) {
    // If Google Calendar query fails, fall back to CalRoute bookings only
    console.error('[availability] Google Calendar query failed, using CalRoute bookings only:', error)
    busyByCalendarId = new Map()
    googleCalendarWarning = 'Using CalRoute bookings. Google Calendar may be out of sync.'
  }

  // 5b. Load blackout dates for each host
  const blackoutDatesByHost = await Promise.all(
    filteredHostsData.map(async h => {
      const bdSnap = await adminDb
        .collection('hosts')
        .doc(h.hostId)
        .collection('blackout_dates')
        .get()
      return {
        hostId: h.hostId,
        dates: bdSnap.docs.map(d => {
          const data = d.data()
          return {
            start: startOfDay(parseISO(data.startDate)),
            end: endOfDay(parseISO(data.endDate)),
          }
        }),
      }
    })
  )

  // 6. Build host structs for engine
  const hosts = filteredHostsData.map(h => {
    const allBusy = h.calendars.flatMap((cal: any) =>
      busyByCalendarId.get(cal.id) ?? []
    )

    // Add blackout dates as all-day busy slots
    const blackouts = blackoutDatesByHost
      .find(bd => bd.hostId === h.hostId)
      ?.dates.map(d => ({
        start: d.start.toISOString(),
        end: d.end.toISOString(),
      })) ?? []

    return {
      id: h.hostId,
      timezone: h.host?.timezone ?? 'UTC',
      availability: h.availability.map((a: any) => ({
        dayOfWeek: a.dayOfWeek,
        // Support both old format (startTime/endTime) and new (ranges)
        ranges: a.ranges ?? (a.startTime ? [{ startTime: a.startTime, endTime: a.endTime }] : []),
      })),
      busySlots: [...allBusy, ...blackouts],
      priority: h.priority,
      lastBookedAt: h.lastBookedAt ? new Date(h.lastBookedAt) : null,
    }
  })

  // 7. Load existing bookings
  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('bookingLinkId', '==', linkDoc.id)
    .where('status', '==', 'confirmed')
    .where('startTime', '>=', startDate.toISOString())
    .where('startTime', '<=', endDate.toISOString())
    .get()

  const existingBookings = bookingsSnap.docs.map(d => {
    const data = d.data()
    return {
      hostId: data.hostId,
      start: new Date(data.startTime),
      end: new Date(data.endTime),
    }
  })

  // 8. Compute slots
  const slots = computeAvailableSlots({
    hosts,
    startDate,
    endDate,
    durationMinutes: link.durationMinutes,
    bufferBeforeMinutes: link.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: link.bufferAfterMinutes ?? 0,
    routingStrategy: link.routingStrategy ?? 'priority',
    existingBookings,
    guestTimezone,
  })

  // Build warning message
  const warnings: string[] = []
  if (googleCalendarWarning) warnings.push(googleCalendarWarning)
  if (outdatedCalendars.length > 0) {
    warnings.push(`Calendar sync outdated for: ${outdatedCalendars.join(', ')}`)
  }

  return NextResponse.json({
    link: {
      title: link.title,
      description: link.description ?? null,
      duration_minutes: link.durationMinutes,
    },
    slots: slots.map(s => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      assignedHostId: s.assignedHostId,
    })),
    ...(warnings.length > 0 && { warnings }),
  })
}
