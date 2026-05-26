import { addMinutes, areIntervalsOverlapping, eachDayOfInterval, getDay, parseISO, set } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import type { BusySlot } from '@/lib/google/calendar'

export interface TimeSlot {
  start: Date
  end: Date
}

export interface HostAvailability {
  dayOfWeek: number  // 0=Sun, 6=Sat
  startTime: string  // "09:00"
  endTime: string    // "17:00"
}

export interface HostWithCalendars {
  id: string
  timezone: string
  availability: HostAvailability[]
  busySlots: BusySlot[]      // merged from all their calendars
  priority: number
  lastBookedAt: Date | null
}

/**
 * Parse a "HH:mm" time string into hours and minutes.
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours, minutes }
}

/**
 * Generate available time slots for a single host on a given day.
 */
function getSlotsForHostOnDay(
  host: HostWithCalendars,
  day: Date,
  durationMinutes: number,
  bufferBeforeMinutes: number,
  bufferAfterMinutes: number,
): TimeSlot[] {
  const dayOfWeek = getDay(day)
  const availWindow = host.availability.find(a => a.dayOfWeek === dayOfWeek)
  if (!availWindow) return []

  const { hours: startH, minutes: startM } = parseTime(availWindow.startTime)
  const { hours: endH, minutes: endM } = parseTime(availWindow.endTime)

  // Convert availability window to UTC using host's timezone
  const windowStart = fromZonedTime(
    set(day, { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 }),
    host.timezone
  )
  const windowEnd = fromZonedTime(
    set(day, { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 }),
    host.timezone
  )

  const slots: TimeSlot[] = []
  let cursor = windowStart

  while (addMinutes(cursor, durationMinutes) <= windowEnd) {
    const slotStart = cursor
    const slotEnd = addMinutes(cursor, durationMinutes)

    // Check against busy slots (including buffer zones)
    const effectiveStart = addMinutes(slotStart, -bufferBeforeMinutes)
    const effectiveEnd = addMinutes(slotEnd, bufferAfterMinutes)

    const isBusy = host.busySlots.some(busy => {
      const busyStart = parseISO(busy.start)
      const busyEnd = parseISO(busy.end)
      return areIntervalsOverlapping(
        { start: effectiveStart, end: effectiveEnd },
        { start: busyStart, end: busyEnd },
        { inclusive: false }
      )
    })

    if (!isBusy) {
      slots.push({ start: slotStart, end: slotEnd })
    }

    cursor = addMinutes(cursor, durationMinutes)
  }

  return slots
}

export interface AvailableSlot {
  start: Date
  end: Date
  availableHosts: string[]   // host IDs who are free at this time
  assignedHostId: string     // who would be assigned based on routing strategy
}

/**
 * Main scheduling engine.
 * Returns all available slots across a date range with host assignment.
 */
export function computeAvailableSlots(params: {
  hosts: HostWithCalendars[]
  startDate: Date
  endDate: Date
  durationMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  routingStrategy: 'priority' | 'round_robin'
  existingBookings: Array<{ hostId: string; start: Date; end: Date }>
}): AvailableSlot[] {
  const {
    hosts,
    startDate,
    endDate,
    durationMinutes,
    bufferBeforeMinutes,
    bufferAfterMinutes,
    routingStrategy,
    existingBookings,
  } = params

  // Add existing bookings to each host's busy slots
  const hostsWithBookings: HostWithCalendars[] = hosts.map(host => ({
    ...host,
    busySlots: [
      ...host.busySlots,
      ...existingBookings
        .filter(b => b.hostId === host.id)
        .map(b => ({
          start: b.start.toISOString(),
          end: b.end.toISOString(),
        })),
    ],
  }))

  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const slotMap = new Map<string, AvailableSlot>()

  for (const day of days) {
    // Collect all slots each host is free on this day
    const hostSlotsOnDay = hostsWithBookings.map(host => ({
      host,
      slots: getSlotsForHostOnDay(
        host,
        day,
        durationMinutes,
        bufferBeforeMinutes,
        bufferAfterMinutes
      ),
    }))

    // Union all slot start times across all hosts
    const allStartTimes = new Set(
      hostSlotsOnDay.flatMap(h => h.slots.map(s => s.start.toISOString()))
    )

    for (const startTimeISO of allStartTimes) {
      const slotStart = new Date(startTimeISO)
      const slotEnd = addMinutes(slotStart, durationMinutes)

      // Find all hosts free at this time
      const freeHosts = hostSlotsOnDay
        .filter(h => h.slots.some(s => s.start.toISOString() === startTimeISO))
        .map(h => h.host)

      if (freeHosts.length === 0) continue

      // Assign based on routing strategy
      const assignedHost = selectHost(freeHosts, routingStrategy)

      slotMap.set(startTimeISO, {
        start: slotStart,
        end: slotEnd,
        availableHosts: freeHosts.map(h => h.id),
        assignedHostId: assignedHost.id,
      })
    }
  }

  return Array.from(slotMap.values()).sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  )
}

/**
 * Select which host to assign a slot to based on routing strategy.
 */
function selectHost(
  freeHosts: HostWithCalendars[],
  strategy: 'priority' | 'round_robin'
): HostWithCalendars {
  if (freeHosts.length === 1) return freeHosts[0]

  if (strategy === 'priority') {
    // Sort by priority descending, then last booked ascending (least recently booked wins tie)
    return freeHosts.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      if (!a.lastBookedAt) return -1
      if (!b.lastBookedAt) return 1
      return a.lastBookedAt.getTime() - b.lastBookedAt.getTime()
    })[0]
  }

  // Round-robin: pick whoever was booked longest ago (or never)
  return freeHosts.sort((a, b) => {
    if (!a.lastBookedAt) return -1
    if (!b.lastBookedAt) return 1
    return a.lastBookedAt.getTime() - b.lastBookedAt.getTime()
  })[0]
}
