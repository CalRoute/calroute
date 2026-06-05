'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TeamMeeting } from '@/types/database'
import CreateMeetingDialog from './CreateMeetingDialog'

interface Props {
  initialMeetings: Array<TeamMeeting & { id: string }>
  hostMap: Record<string, any>
}

export default function TeamMeetingsManager({ initialMeetings, hostMap }: Props) {
  const [meetings, setMeetings] = useState(initialMeetings)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleMeetingCreated = (newMeeting: TeamMeeting & { id: string }) => {
    setMeetings([newMeeting, ...meetings])
    setShowCreateDialog(false)
  }

  const handleMeetingDeleted = (meetingId: string) => {
    setMeetings(meetings.filter(m => m.id !== meetingId))
  }

  return (
    <>
      <div className="mb-8">
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-6 py-3 bg-[#0D7377] text-white font-medium rounded-xl hover:bg-[#0a5f63] transition-colors"
        >
          + New Meeting
        </button>
      </div>

      {meetings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No recurring meetings yet.</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="text-[#0D7377] hover:underline font-medium"
          >
            Create your first team meeting →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map(meeting => (
            <div
              key={meeting.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
            >
              <Link href={`/dashboard/team/meetings/${meeting.id}`}>
                <div className="cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{meeting.title}</h3>
                  {meeting.description && (
                    <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {new Date(meeting.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {meeting.durationMinutes} min
                    </span>
                    <span>{meeting.attendeeHostIds.length} attendee{meeting.attendeeHostIds.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {meeting.attendeeHostIds.map(hostId => (
                      <span
                        key={hostId}
                        className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
                      >
                        {hostMap[hostId]?.name || hostId}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateMeetingDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleMeetingCreated}
          hostMap={hostMap}
        />
      )}
    </>
  )
}
