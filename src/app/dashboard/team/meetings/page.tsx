import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import type { TeamMeeting } from '@/types/database'
import TeamMeetingsManager from './TeamMeetingsManager'

export const metadata = {
  title: 'Team Meetings — CalRoute',
}

export default async function TeamMeetingsPage() {
  const user = await requireUser('/dashboard/team/meetings')

  const meetingsSnap = await adminDb
    .collection('team_meetings')
    .where('teamId', '==', user.uid)
    .where('status', '==', 'active')
    .get()

  const meetings = meetingsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<TeamMeeting & { id: string }>

  // Sort by startTime descending
  meetings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  // Fetch all team members from team booking links
  const linksSnap = await adminDb
    .collection('booking_links')
    .where('ownerId', '==', user.uid)
    .get()

  const allHostIds = new Set<string>()
  allHostIds.add(user.uid) // Add owner

  for (const linkDoc of linksSnap.docs) {
    const hostsSnap = await adminDb
      .collection('booking_links')
      .doc(linkDoc.id)
      .collection('hosts')
      .get()
    hostsSnap.docs.forEach(doc => allHostIds.add((doc.data() as any).hostId))
  }

  // Also add attendees from existing meetings
  meetings.forEach(m => m.attendeeHostIds.forEach(id => allHostIds.add(id)))

  const hostDocs = await Promise.all(
    Array.from(allHostIds).map(id => adminDb.collection('hosts').doc(id).get())
  )

  const hostMap = new Map(
    hostDocs.map(doc => [doc.id, doc.data() as any])
  )

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Team Meetings</h1>
          <p className="text-gray-600">Schedule and manage recurring team standups, retrospectives, and more.</p>
        </div>

        <TeamMeetingsManager initialMeetings={meetings} hostMap={Object.fromEntries(hostMap)} />
      </div>
    </div>
  )
}
