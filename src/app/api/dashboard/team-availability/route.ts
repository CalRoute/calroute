import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { queryFreeBusy } from '@/lib/google/calendar'
import { startOfDay, addHours } from 'date-fns'
import type { ConnectedCalendar } from '@/types/database'

export async function POST(request: Request) {
  const user = await requireUser('/dashboard')

  const { members } = await request.json() as { members: Array<{ uid: string; name: string }> }

  if (!Array.isArray(members) || members.length === 0) {
    return Response.json({ statuses: [] })
  }

  try {
    const now = new Date()
    const endOfDay = addHours(startOfDay(now), 24)  // Tomorrow midnight instead of 11 PM today

    const statuses = await Promise.all(
      members.map(async member => {
        try {
          // Fetch connected calendars
          const calsSnap = await adminDb
            .collection('hosts').doc(member.uid)
            .collection('connected_calendars')
            .where('isActive', '==', true)
            .get()

          if (calsSnap.empty) {
            console.warn(`[availability] ${member.uid} has no connected calendars`)
            return { uid: member.uid, name: member.name, status: 'unknown' }
          }

          const calendars = calsSnap.docs.map(d => {
            const data = d.data()
            return {
              id: d.id,
              provider: data.provider,
              accountEmail: data.accountEmail,
              calendarId: data.calendarId,
              label: data.label,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresAt: data.expiresAt,
              isActive: data.isActive,
              createdAt: data.createdAt,
            } as ConnectedCalendar
          })

          // Validate all required fields
          const missingFields = calendars.flatMap((c, i) => {
            const missing = []
            if (!c.accessToken) missing.push(`[${i}] accessToken`)
            if (!c.refreshToken) missing.push(`[${i}] refreshToken`)
            if (!c.calendarId) missing.push(`[${i}] calendarId`)
            if (!c.expiresAt) missing.push(`[${i}] expiresAt`)
            return missing
          })

          if (missingFields.length > 0) {
            console.error(`[availability] ${member.uid} has incomplete calendar data: ${missingFields.join(', ')}`)
            return { uid: member.uid, name: member.name, status: 'unknown' }
          }

          console.log(`[availability] ${member.uid} has ${calendars.length} calendars`, {
            calendarIds: calendars.map(c => c.calendarId),
            accounts: calendars.map(c => c.accountEmail),
          })

          // Query free/busy for today with token refresh callback
          console.log(`[availability] querying free/busy for ${member.uid} from ${now.toISOString()} to ${endOfDay.toISOString()}`)
          const busySlots = await queryFreeBusy(
            calendars,
            now,
            endOfDay,
            async (calendarId, token, expiresAt) => {
              console.log(`[availability] refreshed token for calendar ${calendarId}`)
              // Persist refreshed token
              await adminDb
                .collection('hosts').doc(member.uid)
                .collection('connected_calendars').doc(calendarId)
                .update({
                  accessToken: token,
                  expiresAt: expiresAt.toISOString(),
                })
            }
          )

          console.log(`[availability] free/busy result for ${member.uid}:`, {
            busySlotsCount: busySlots.size,
            busySlots: Array.from(busySlots.entries()).map(([id, slots]) => ({ id, count: slots.length })),
          })

          // Check if busy in next 30 minutes
          const inThirtyMin = addHours(now, 0.5)
          const isBusy = Array.from(busySlots.values()).some(slots =>
            slots.some(slot => {
              const slotStart = new Date(slot.start).getTime()
              const slotEnd = new Date(slot.end).getTime()
              const nowTime = now.getTime()
              const thirtyMinTime = inThirtyMin.getTime()
              return slotStart < thirtyMinTime && slotEnd > nowTime
            })
          )

          console.log(`[availability] ${member.uid} is ${isBusy ? 'busy' : 'available'}`)

          return {
            uid: member.uid,
            name: member.name,
            status: isBusy ? 'in-meeting' : 'available',
          }
        } catch (error) {
          console.error(`[availability] error checking ${member.uid}:`, error instanceof Error ? error.message : String(error))
          return { uid: member.uid, name: member.name, status: 'unknown' }
        }
      })
    )

    return Response.json({ statuses })
  } catch (error) {
    console.error('[availability] error:', error)
    return Response.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}
