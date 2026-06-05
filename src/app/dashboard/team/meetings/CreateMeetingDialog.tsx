'use client'

import { useState } from 'react'
import type { TeamMeeting } from '@/types/database'

const RRULE_TEMPLATES = [
  { label: 'Weekly on Monday', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO' },
  { label: 'Weekly on Monday, Wednesday, Friday', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR' },
  { label: 'Every weekday (Mon-Fri)', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { label: 'Every other week', value: 'RRULE:FREQ=WEEKLY;INTERVAL=2' },
  { label: 'Every month on the 1st', value: 'RRULE:FREQ=MONTHLY;BYMONTHDAY=1' },
]

interface Props {
  onClose: () => void
  onCreated: (meeting: TeamMeeting & { id: string }) => void
  hostMap: Record<string, any>
}

export default function CreateMeetingDialog({ onClose, onCreated, hostMap }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [timezone, setTimezone] = useState('UTC')
  const [rrule, setRrule] = useState(RRULE_TEMPLATES[0].value)
  const [customRrule, setCustomRrule] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hostIds = Object.keys(hostMap)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || selectedAttendees.length === 0) {
      setError('Please enter a title and select at least one attendee')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const finalRrule = customRrule || rrule
      const now = new Date()
      const [hours, minutes] = startTime.split(':').map(Number)
      const meetingStart = new Date(now)
      meetingStart.setHours(hours, minutes, 0, 0)

      const response = await fetch('/api/team-meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          attendeeHostIds: selectedAttendees,
          startTime: meetingStart.toISOString(),
          durationMinutes: Number(durationMinutes),
          timezone,
          rrule: finalRrule,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create meeting')
      }

      const newMeeting = await response.json()
      onCreated(newMeeting)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">New Meeting</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Weekly Standup"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add context or agenda..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Attendees
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {hostIds.map(hostId => (
                <label key={hostId} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedAttendees.includes(hostId)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedAttendees([...selectedAttendees, hostId])
                      } else {
                        setSelectedAttendees(selectedAttendees.filter(id => id !== hostId))
                      }
                    }}
                    disabled={loading}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{hostMap[hostId]?.name || hostId}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Duration (min)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                min={5}
                max={480}
                step={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Recurrence
            </label>
            <select
              value={customRrule ? 'custom' : rrule}
              onChange={e => {
                if (e.target.value === 'custom') {
                  setCustomRrule('')
                } else {
                  setRrule(e.target.value)
                  setCustomRrule('')
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              disabled={loading}
            >
              {RRULE_TEMPLATES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
              <option value="custom">Custom RRULE</option>
            </select>

            {customRrule !== '' && (
              <input
                type="text"
                value={customRrule}
                onChange={e => setCustomRrule(e.target.value)}
                placeholder="e.g. RRULE:FREQ=DAILY"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] mt-2"
                disabled={loading}
              />
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#0D7377] text-white font-medium rounded-lg hover:bg-[#0a5f63] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
