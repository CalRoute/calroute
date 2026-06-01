import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { queryFreeBusy } from '@/lib/google/calendar'
import { startOfDay, addHours } from 'date-fns'

export async function POST(request: Request) {
  const user = await requireUser('/dashboard')

  const { members } = await request.json() as { members: Array<{ uid: string; name: string }> }

  if (!Array.isArray(members) || members.length === 0) {
    return Response.json({ statuses: [] })
  }

  try {
    const now = new Date()
    const endOfDay = addHours(startOfDay(now), 23)

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
            return { uid: member.uid, name: member.name, status: 'unknown' }
          }

          const calendars = calsSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as any[]

          // Query free/busy for today
          const busySlots = await queryFreeBusy(
            calendars,
            now,
            endOfDay,
          )

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

          return {
            uid: member.uid,
            name: member.name,
            status: isBusy ? 'in-meeting' : 'available',
          }
        } catch (error) {
          console.error(`[availability] error checking ${member.uid}:`, error)
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
