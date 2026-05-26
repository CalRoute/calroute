import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { queryFreeBusy } from '@/lib/google/calendar'
import { computeAvailableSlots } from '@/lib/scheduling/engine'
import { addDays, startOfDay, endOfDay, parseISO } from 'date-fns'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const startDateParam = searchParams.get('start')
  const timezone = searchParams.get('timezone') ?? 'UTC'

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // 1. Load booking link
  const { data: link, error: linkError } = await supabase
    .from('booking_links')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (linkError || !link) {
    return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
  }

  // 2. Determine date range to query (default: today + max_days_ahead)
  const startDate = startDateParam
    ? startOfDay(parseISO(startDateParam))
    : startOfDay(new Date())
  const endDate = endOfDay(addDays(startDate, Math.min(link.max_days_ahead, 14)))

  // 3. Load hosts for this link with their calendars and availability
  const { data: linkHosts } = await supabase
    .from('booking_link_hosts')
    .select(`
      priority,
      last_booked_at,
      host:hosts(
        id,
        timezone,
        host_availability(*),
        connected_calendars(*)
      )
    `)
    .eq('booking_link_id', link.id)

  if (!linkHosts || linkHosts.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  // 4. Fetch freeBusy for all calendars in a single batch per account
  const allCalendars = linkHosts.flatMap(
    lh => (lh.host as any)?.connected_calendars?.filter((c: any) => c.is_active) ?? []
  )

  const busyByCalendarId = await queryFreeBusy(
    allCalendars,
    startDate,
    endDate,
    async (calendarId, token, expiresAt) => {
      await supabase
        .from('connected_calendars')
        .update({ access_token: token, expires_at: expiresAt.toISOString() })
        .eq('id', calendarId)
    }
  )

  // 5. Merge busy slots per host (across all their calendars)
  const hosts = linkHosts.map(lh => {
    const host = lh.host as any
    const calendars: any[] = host.connected_calendars?.filter((c: any) => c.is_active) ?? []
    const allBusy = calendars.flatMap(cal => busyByCalendarId.get(cal.id) ?? [])

    return {
      id: host.id,
      timezone: host.timezone ?? 'UTC',
      availability: (host.host_availability ?? []).map((a: any) => ({
        dayOfWeek: a.day_of_week,
        startTime: a.start_time,
        endTime: a.end_time,
      })),
      busySlots: allBusy,
      priority: lh.priority ?? 1,
      lastBookedAt: lh.last_booked_at ? new Date(lh.last_booked_at) : null,
    }
  })

  // 6. Load existing confirmed bookings in the range
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('host_id, start_time, end_time')
    .eq('booking_link_id', link.id)
    .eq('status', 'confirmed')
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())

  // 7. Compute available slots
  const slots = computeAvailableSlots({
    hosts,
    startDate,
    endDate,
    durationMinutes: link.duration_minutes,
    bufferBeforeMinutes: link.buffer_before_minutes,
    bufferAfterMinutes: link.buffer_after_minutes,
    routingStrategy: link.routing_strategy as 'priority' | 'round_robin',
    existingBookings: (existingBookings ?? []).map(b => ({
      hostId: b.host_id,
      start: new Date(b.start_time),
      end: new Date(b.end_time),
    })),
  })

  return NextResponse.json({
    link: {
      title: link.title,
      description: link.description,
      duration_minutes: link.duration_minutes,
    },
    slots: slots.map(s => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      assignedHostId: s.assignedHostId,
    })),
  })
}
