import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import type { TeamMeeting } from '@/types/database'
import MeetingNotesEditor from './MeetingNotesEditor'

export const metadata = {
  title: 'Meeting Notes | CalRoute',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function MeetingDetailPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser('/dashboard/team/meetings')

  const meetingSnap = await adminDb.collection('team_meetings').doc(id).get()
  if (!meetingSnap.exists) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Meeting not found</h1>
        </div>
      </div>
    )
  }

  const meeting = { id, ...meetingSnap.data() } as TeamMeeting & { id: string }

  // Verify access
  if (meeting.teamId !== user.uid && !meeting.attendeeHostIds.includes(user.uid)) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
        </div>
      </div>
    )
  }

  // Fetch attendee details
  const attendeeSnaps = await Promise.all(
    meeting.attendeeHostIds.map(id => adminDb.collection('hosts').doc(id).get())
  )

  const attendees = attendeeSnaps
    .map(snap => snap.data() as any)
    .filter(Boolean)

  // Fetch existing notes
  const notesSnap = await adminDb
    .collection('team_meetings')
    .doc(id)
    .collection('notes')
    .orderBy('occurrence', 'desc')
    .get()

  const notes = notesSnap.docs.map(doc => {
    const data = doc.data() as any
    return {
      occurrence: doc.id,
      authorId: data.authorId || '',
      content: data.content || '',
      actionItems: data.actionItems || [],
      emailSentAt: data.emailSentAt || null,
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || '',
    }
  })

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{meeting.title}</h1>
          {meeting.description && (
            <p className="text-gray-600">{meeting.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>
              {new Date(meeting.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              • {meeting.durationMinutes} min
            </span>
            <span>Timezone: {meeting.timezone}</span>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Attendees ({attendees.length})</h3>
            <div className="flex flex-wrap gap-2">
              {attendees.map(attendee => (
                <span
                  key={attendee.uid}
                  className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full"
                >
                  {attendee.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <MeetingNotesEditor
          meetingId={id}
          meetingTitle={meeting.title}
          attendees={attendees}
          initialNotes={notes}
        />
      </div>
    </div>
  )
}
