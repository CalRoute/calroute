'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type { TeamMeeting } from '@/types/database'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Montreal', 'America/Sao_Paulo',
  'America/Mexico_City', 'America/Bogota', 'America/Lima', 'America/Santiago',
  'America/Buenos_Aires', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels',
  'Europe/Zurich', 'Europe/Stockholm', 'Europe/Oslo', 'Europe/Helsinki',
  'Europe/Warsaw', 'Europe/Prague', 'Europe/Vienna', 'Europe/Lisbon',
  'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow', 'Africa/Cairo',
  'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Nairobi', 'Asia/Dubai',
  'Asia/Riyadh', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
  'Asia/Jakarta', 'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Asia/Hong_Kong',
  'Asia/Shanghai', 'Asia/Taipei', 'Asia/Seoul', 'Asia/Tokyo',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth',
  'Pacific/Auckland', 'Pacific/Honolulu', 'UTC',
]

function getOffset(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz, timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value ?? 'UTC'
  } catch { return 'UTC' }
}

function formatLabel(tz: string): string {
  return tz.replace(/_/g, ' ').replace('/', ' / ')
}

const RRULE_TEMPLATES = [
  { label: 'Daily', value: 'RRULE:FREQ=DAILY' },
  { label: 'Weekly on Monday', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO' },
  { label: 'Weekly on Monday, Wednesday, Friday', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR' },
  { label: 'Every weekday (Mon-Fri)', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { label: 'Monthly', value: 'RRULE:FREQ=MONTHLY' },
]

const WEEKDAYS = [
  { abbr: 'Mo', label: 'Monday', rrule: 'MO' },
  { abbr: 'Tu', label: 'Tuesday', rrule: 'TU' },
  { abbr: 'We', label: 'Wednesday', rrule: 'WE' },
  { abbr: 'Th', label: 'Thursday', rrule: 'TH' },
  { abbr: 'Fr', label: 'Friday', rrule: 'FR' },
  { abbr: 'Sa', label: 'Saturday', rrule: 'SA' },
  { abbr: 'Su', label: 'Sunday', rrule: 'SU' },
]

function buildRruleFromCustom(frequency: string, interval: number, weekdays?: string[], monthDay?: number): string {
  if (frequency === 'WEEKLY' && weekdays && weekdays.length > 0) {
    const byDay = weekdays.join(',')
    const intervalPart = interval > 1 ? `;INTERVAL=${interval}` : ''
    return `RRULE:FREQ=WEEKLY;BYDAY=${byDay}${intervalPart}`
  }
  if (frequency === 'MONTHLY' && monthDay) {
    const intervalPart = interval > 1 ? `;INTERVAL=${interval}` : ''
    return `RRULE:FREQ=MONTHLY;BYMONTHDAY=${monthDay}${intervalPart}`
  }
  const intervalPart = interval > 1 ? `;INTERVAL=${interval}` : ''
  return `RRULE:FREQ=${frequency}${intervalPart}`
}

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
  const [recurrenceMode, setRecurrenceMode] = useState<'preset' | 'custom'>('preset')
  const [selectedPreset, setSelectedPreset] = useState(RRULE_TEMPLATES[0].value)
  const [customFrequency, setCustomFrequency] = useState('WEEKLY')
  const [customInterval, setCustomInterval] = useState(1)
  const [customWeekdays, setCustomWeekdays] = useState<string[]>(['MO'])
  const [customMonthDay, setCustomMonthDay] = useState(1)
  const [timezoneSearch, setTimezoneSearch] = useState('')
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false)
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timezoneContainerRef = useRef<HTMLDivElement>(null)
  const timezoneInputRef = useRef<HTMLInputElement>(null)
  const attendeeContainerRef = useRef<HTMLDivElement>(null)

  const hostIds = Object.keys(hostMap)

  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch.trim()) return TIMEZONES
    const search = timezoneSearch.toLowerCase()
    return TIMEZONES.filter(tz =>
      tz.toLowerCase().includes(search) ||
      formatLabel(tz).toLowerCase().includes(search)
    )
  }, [timezoneSearch])

  const filteredAttendees = useMemo(() => {
    if (!attendeeSearch.trim()) return hostIds
    const search = attendeeSearch.toLowerCase()
    return hostIds.filter(hostId => {
      const host = hostMap[hostId]
      if (!host) return false
      return (
        host.name?.toLowerCase().includes(search) ||
        host.email?.toLowerCase().includes(search) ||
        hostId.toLowerCase().includes(search)
      )
    })
  }, [attendeeSearch, hostIds, hostMap])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (timezoneContainerRef.current && !timezoneContainerRef.current.contains(e.target as Node)) {
        setShowTimezoneDropdown(false)
        setTimezoneSearch('')
      }
      if (attendeeContainerRef.current && !attendeeContainerRef.current.contains(e.target as Node)) {
        setShowAttendeeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (showTimezoneDropdown) setTimeout(() => timezoneInputRef.current?.focus(), 10)
  }, [showTimezoneDropdown])

  const getSelectedRrule = (): string => {
    if (recurrenceMode === 'preset') {
      return selectedPreset
    }
    return buildRruleFromCustom(customFrequency, customInterval, customWeekdays, customMonthDay)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || selectedAttendees.length === 0) {
      setError('Please enter a title and select at least one attendee')
      return
    }

    setLoading(true)
    setError(null)

    try {
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
          rrule: getSelectedRrule(),
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

          <div ref={attendeeContainerRef} className="relative">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Attendees ({selectedAttendees.length} selected)
            </label>
            <input
              type="text"
              value={attendeeSearch}
              onChange={e => setAttendeeSearch(e.target.value)}
              onFocus={() => setShowAttendeeDropdown(true)}
              placeholder="Search by name, email, or username..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              disabled={loading}
            />

            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedAttendees.map(hostId => (
                  <div
                    key={hostId}
                    className="flex items-center gap-2 bg-[#0D7377]/10 text-[#0D7377] px-3 py-1 rounded-full text-sm"
                  >
                    <span>{hostMap[hostId]?.name || hostId}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAttendees(selectedAttendees.filter(id => id !== hostId))}
                      className="hover:text-[#0a5f63] font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAttendeeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredAttendees.length > 0 ? (
                  filteredAttendees.map(hostId => (
                    <button
                      key={hostId}
                      type="button"
                      onClick={() => {
                        if (selectedAttendees.includes(hostId)) {
                          setSelectedAttendees(selectedAttendees.filter(id => id !== hostId))
                        } else {
                          setSelectedAttendees([...selectedAttendees, hostId])
                        }
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 text-sm transition-colors ${
                        selectedAttendees.includes(hostId)
                          ? 'bg-[#0D7377]/10 hover:bg-[#0D7377]/20'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedAttendees.includes(hostId)}
                          onChange={() => {}}
                          className="w-4 h-4 pointer-events-none"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{hostMap[hostId]?.name || hostId}</div>
                          <div className="text-xs text-gray-500">{hostMap[hostId]?.email || hostId}</div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No attendees found
                  </div>
                )}
              </div>
            )}
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

          <div ref={timezoneContainerRef} className="relative">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Timezone
            </label>
            <button
              type="button"
              onClick={() => setShowTimezoneDropdown(o => !o)}
              disabled={loading}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm transition-all bg-white text-left ${
                showTimezoneDropdown ? 'border-[#0D7377] ring-2 ring-[#0D7377]/15' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">{formatLabel(timezone)}</div>
                <div className="text-xs text-gray-500">{getOffset(timezone)}</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {showTimezoneDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                <input
                  ref={timezoneInputRef}
                  type="text"
                  value={timezoneSearch}
                  onChange={e => setTimezoneSearch(e.target.value)}
                  placeholder="Search timezone..."
                  className="w-full px-4 py-2 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:ring-inset rounded-t-lg"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredTimezones.length > 0 ? (
                    filteredTimezones.map(tz => (
                      <button
                        key={tz}
                        type="button"
                        onClick={() => {
                          setTimezone(tz)
                          setTimezoneSearch('')
                          setShowTimezoneDropdown(false)
                        }}
                        className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">{formatLabel(tz)}</div>
                        <div className="text-xs text-gray-500">{getOffset(tz)}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No timezones found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Recurrence
            </label>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setRecurrenceMode('preset')
                  setSelectedPreset(RRULE_TEMPLATES[0].value)
                }}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  recurrenceMode === 'preset'
                    ? 'bg-[#0D7377] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quick Presets
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceMode('custom')}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  recurrenceMode === 'custom'
                    ? 'bg-[#0D7377] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Pattern
              </button>
            </div>

            {/* Preset mode */}
            {recurrenceMode === 'preset' && (
              <div className="space-y-2">
                {RRULE_TEMPLATES.map(t => (
                  <label key={t.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="recurrence"
                      value={t.value}
                      checked={selectedPreset === t.value}
                      onChange={() => setSelectedPreset(t.value)}
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{t.label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Custom mode */}
            {recurrenceMode === 'custom' && (
              <div className="space-y-4">
                {/* Frequency selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Frequency</label>
                  <div className="flex gap-2">
                    {['DAILY', 'WEEKLY', 'MONTHLY'].map(freq => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setCustomFrequency(freq)}
                        disabled={loading}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          customFrequency === freq
                            ? 'bg-[#0D7377] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {freq === 'DAILY' ? 'Daily' : freq === 'WEEKLY' ? 'Weekly' : 'Monthly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interval selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Every
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={customInterval}
                      onChange={e => setCustomInterval(Math.max(1, Number(e.target.value)))}
                      disabled={loading}
                      className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-center"
                    />
                    <span className="text-sm text-gray-700">
                      {customFrequency === 'DAILY' && (customInterval === 1 ? 'day' : 'days')}
                      {customFrequency === 'WEEKLY' && (customInterval === 1 ? 'week' : 'weeks')}
                      {customFrequency === 'MONTHLY' && (customInterval === 1 ? 'month' : 'months')}
                    </span>
                  </div>
                </div>

                {/* Weekly: day selector */}
                {customFrequency === 'WEEKLY' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">On these days</label>
                    <div className="grid grid-cols-4 gap-2">
                      {WEEKDAYS.map(day => (
                        <button
                          key={day.rrule}
                          type="button"
                          onClick={() => {
                            setCustomWeekdays(
                              customWeekdays.includes(day.rrule)
                                ? customWeekdays.filter(d => d !== day.rrule)
                                : [...customWeekdays, day.rrule].sort()
                            )
                          }}
                          disabled={loading}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            customWeekdays.includes(day.rrule)
                              ? 'bg-[#0D7377] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day.abbr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly: date selector */}
                {customFrequency === 'MONTHLY' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">On day of month</label>
                    <select
                      value={customMonthDay}
                      onChange={e => setCustomMonthDay(Number(e.target.value))}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-sm"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* RRULE preview */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Generated RRULE</div>
                  <code className="text-xs text-gray-600 break-all font-mono">
                    {getSelectedRrule()}
                  </code>
                </div>
              </div>
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
