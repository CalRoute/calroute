export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { fireWebhooks } from '@/lib/webhooks'
import { Resend } from 'resend'
import { meetingNotesSummaryEmail } from '@/lib/email-templates/meeting-notes-summary'
import { nanoid } from 'nanoid'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const meetingSnap = await adminDb.collection('team_meetings').doc(id).get()
    if (!meetingSnap.exists) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const meeting = meetingSnap.data() as any
    if (meeting.teamId !== user.uid && !meeting.attendeeHostIds.includes(user.uid)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notesSnap = await adminDb
      .collection('team_meetings')
      .doc(id)
      .collection('notes')
      .orderBy('occurrence', 'desc')
      .get()

    const notes = notesSnap.docs.map(doc => ({
      occurrence: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('[team-meetings-notes-get] error:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { occurrence, content, actionItems } = await request.json() as {
      occurrence: string
      content: string
      actionItems: Array<{
        id: string
        text: string
        assigneeId: string | null
        trelloCardId?: string
        done: boolean
      }>
    }

    if (!occurrence || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get meeting + verify access
    const meetingSnap = await adminDb.collection('team_meetings').doc(id).get()
    if (!meetingSnap.exists) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const meeting = meetingSnap.data() as any
    if (meeting.teamId !== user.uid && !meeting.attendeeHostIds.includes(user.uid)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Trello cards for action items if Trello is connected
    let updatedActionItems = actionItems
    try {
      const trelloSnap = await adminDb
        .collection('teams')
        .doc(meeting.teamId)
        .collection('integrations')
        .doc('trello')
        .get()

      if (trelloSnap.exists) {
        const trello = trelloSnap.data() as any
        updatedActionItems = await Promise.all(
          actionItems.map(async (item) => {
            if (item.trelloCardId) return item

            try {
              const assigneeName = item.assigneeId
                ? (await adminDb.collection('hosts').doc(item.assigneeId).get()).data()?.name
                : null

              const cardRes = await fetch(
                `https://api.trello.com/1/cards?key=${trello.apiKey}&token=${trello.token}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    idList: trello.listId,
                    name: item.text,
                    desc: `From: ${meeting.title}\nDate: ${occurrence}${
                      assigneeName ? `\nAssigned to: ${assigneeName}` : ''
                    }`,
                  }),
                }
              )

              if (cardRes.ok) {
                const card = await cardRes.json()
                console.log('[trello-card-create] created card:', card.id, 'for item:', item.text)
                return { ...item, trelloCardId: card.id }
              } else {
                const errData = await cardRes.text()
                console.error('[trello-card-create] failed:', cardRes.status, errData)
              }
            } catch (err) {
              console.error('[trello-card-create] error:', err)
            }
            return item
          })
        )
      }
    } catch (err) {
      console.error('[trello-integration] error:', err)
    }

    // Save notes
    await adminDb
      .collection('team_meetings')
      .doc(id)
      .collection('notes')
      .doc(occurrence)
      .set(
        {
          occurrence,
          authorId: user.uid,
          content,
          actionItems: updatedActionItems,
          emailSentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

    // Get all attendee emails
    const attendeeSnaps = await Promise.all(
      meeting.attendeeHostIds.map((id: string) => adminDb.collection('hosts').doc(id).get())
    )
    const attendeeEmails = attendeeSnaps
      .map(snap => snap.data() as any)
      .filter(Boolean)
      .map(host => host.email)

    // Send email to all attendees
    try {
      const actionItemsForEmail = updatedActionItems.map(async item => {
        let assigneeName = null
        if (item.assigneeId) {
          const assigneeSnap = await adminDb.collection('hosts').doc(item.assigneeId).get()
          assigneeName = (assigneeSnap.data() as any)?.name || null
        }
        return { text: item.text, assigneeName, done: item.done, trelloCardId: item.trelloCardId }
      })

      const resolvedActionItems = await Promise.all(actionItemsForEmail)

      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calroute.me'
      const emailHtml = meetingNotesSummaryEmail({
        meetingTitle: meeting.title,
        occurrence,
        content,
        actionItems: resolvedActionItems,
        dashboardUrl,
      })

      await Promise.all(
        attendeeEmails.map(email =>
          resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: email,
            subject: `Meeting notes: ${meeting.title}`,
            html: emailHtml,
          })
        )
      )
    } catch (emailErr) {
      console.error('[team-meetings-notes] email failed:', emailErr)
    }

    // Fire webhook
    await fireWebhooks(meeting.teamId, 'meeting.notes_saved', {
      meeting_id: id,
      meeting_title: meeting.title,
      occurrence,
      action_item_count: actionItems.length,
      author_id: user.uid,
    })

    return NextResponse.json({ success: true, occurrence })
  } catch (error) {
    console.error('[team-meetings-notes-post] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save notes' },
      { status: 500 }
    )
  }
}
