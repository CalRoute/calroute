export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { deleteCalendarEvent } from '@/lib/google/calendar'

async function getAuthedMeeting(meetingId: string) {
  const user = await getServerUser()
  if (!user) return null

  const meetingSnap = await adminDb.collection('team_meetings').doc(meetingId).get()
  if (!meetingSnap.exists) return null

  const meeting = meetingSnap.data() as any
  if (meeting.teamId !== user.uid) return null

  return { user, meeting, meetingSnap }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authed = await getAuthedMeeting(id)
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, description, attendeeHostIds } = await request.json() as {
      title?: string
      description?: string
      attendeeHostIds?: string[]
    }

    const updates: Record<string, any> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (attendeeHostIds !== undefined) updates.attendeeHostIds = attendeeHostIds

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    await authed.meetingSnap.ref.update(updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[team-meetings-patch] error:', error)
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authed = await getAuthedMeeting(id)
  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    if (authed.meeting.googleEventId) {
      const calSnap = await adminDb
        .collection('hosts')
        .doc(authed.user.uid)
        .collection('connected_calendars')
        .where('isActive', '==', true)
        .limit(1)
        .get()

      if (!calSnap.empty) {
        const calData = calSnap.docs[0].data()
        await deleteCalendarEvent(
          { id: calSnap.docs[0].id, ...calData } as any,
          authed.meeting.googleEventId
        )
      }
    }

    await authed.meetingSnap.ref.update({ status: 'cancelled' })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[team-meetings-delete] error:', error)
    return NextResponse.json({ error: 'Failed to cancel meeting' }, { status: 500 })
  }
}
