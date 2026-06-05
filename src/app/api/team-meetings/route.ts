export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { createRecurringTeamMeeting } from '@/lib/google/calendar'
import type { TeamMeeting } from '@/types/database'
import { nanoid } from 'nanoid'

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const meetingsSnap = await adminDb
      .collection('team_meetings')
      .where('teamId', '==', user.uid)
      .get()

    const meetings = meetingsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as TeamMeeting & { id: string }))
      .filter(m => m.status === 'active')

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('[team-meetings-get] error:', error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, description, attendeeHostIds, startTime, durationMinutes, timezone, rrule } =
      await request.json() as {
        title: string
        description?: string
        attendeeHostIds: string[]
        startTime: string
        durationMinutes: number
        timezone: string
        rrule: string
      }

    if (!title || !attendeeHostIds?.length || !startTime || !durationMinutes || !rrule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch all attendee emails
    const attendeeSnaps = await Promise.all(
      attendeeHostIds.map(id => adminDb.collection('hosts').doc(id).get())
    )
    const attendeeEmails = attendeeSnaps.map(snap => {
      const data = snap.data() as any
      return data?.email
    }).filter(Boolean)

    if (attendeeEmails.length === 0) {
      return NextResponse.json({ error: 'No valid attendees found' }, { status: 400 })
    }

    // Get user's connected calendar for creating the Google event
    const calSnap = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('connected_calendars')
      .where('isActive', '==', true)
      .limit(1)
      .get()

    if (calSnap.empty) {
      return NextResponse.json({ error: 'No active calendar connected' }, { status: 400 })
    }

    const calData = calSnap.docs[0].data()
    const googleEventId = await createRecurringTeamMeeting(
      { id: calSnap.docs[0].id, ...calData } as any,
      {
        title,
        description,
        startTime: new Date(startTime),
        durationMinutes,
        attendeeEmails,
        rrule,
        timezone,
      }
    )

    // Create meeting in Firestore
    const meetingId = nanoid()
    await adminDb.collection('team_meetings').doc(meetingId).set({
      id: meetingId,
      teamId: user.uid,
      createdBy: user.uid,
      title,
      description,
      attendeeHostIds,
      startTime,
      durationMinutes,
      timezone,
      rrule,
      googleEventId,
      status: 'active',
      createdAt: new Date().toISOString(),
    } as TeamMeeting)

    return NextResponse.json({
      id: meetingId,
      teamId: user.uid,
      createdBy: user.uid,
      title,
      description,
      attendeeHostIds,
      startTime,
      durationMinutes,
      timezone,
      rrule,
      googleEventId,
      status: 'active',
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[team-meetings-post] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create meeting' },
      { status: 500 }
    )
  }
}
