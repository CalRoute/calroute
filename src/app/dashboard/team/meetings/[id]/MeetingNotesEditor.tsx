'use client'

import { useState } from 'react'
import type { MeetingNote } from '@/types/database'

interface Props {
  meetingId: string
  meetingTitle: string
  attendees: Array<{ uid: string; name: string; email: string }>
  initialNotes: Array<MeetingNote & { occurrence: string }>
}

export default function MeetingNotesEditor({
  meetingId,
  meetingTitle,
  attendees,
  initialNotes,
}: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [selectedOccurrence, setSelectedOccurrence] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [actionItems, setActionItems] = useState<
    Array<{ id: string; text: string; assigneeId: string | null; done: boolean }>
  >([])
  const [newActionItem, setNewActionItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate past occurrences (last 12 weeks)
  const now = new Date()
  const pastOccurrences = []
  for (let i = 0; i < 12; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i * 7)
    pastOccurrences.push(date.toISOString().split('T')[0])
  }

  const handleSelectOccurrence = (occurrence: string) => {
    const existingNote = notes.find(n => n.occurrence === occurrence)
    setSelectedOccurrence(occurrence)
    if (existingNote) {
      setContent(existingNote.content)
      setActionItems(existingNote.actionItems)
    } else {
      setContent('')
      setActionItems([])
    }
    setError(null)
  }

  const handleAddActionItem = () => {
    if (!newActionItem.trim()) return
    setActionItems([
      ...actionItems,
      {
        id: `action-${Date.now()}`,
        text: newActionItem,
        assigneeId: null,
        done: false,
      },
    ])
    setNewActionItem('')
  }

  const handleRemoveActionItem = (id: string) => {
    setActionItems(actionItems.filter(item => item.id !== id))
  }

  const handleToggleActionItem = (id: string) => {
    setActionItems(
      actionItems.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    )
  }

  const handleAssignActionItem = (id: string, assigneeId: string | null) => {
    setActionItems(
      actionItems.map(item =>
        item.id === id ? { ...item, assigneeId } : item
      )
    )
  }

  const handleSaveNotes = async () => {
    if (!selectedOccurrence || !content.trim()) {
      setError('Please select an occurrence and add some notes')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/team-meetings/${meetingId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occurrence: selectedOccurrence,
          content,
          actionItems,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save notes')
      }

      // Update local notes
      const existingIndex = notes.findIndex(n => n.occurrence === selectedOccurrence)
      if (existingIndex >= 0) {
        const updatedNotes = [...notes]
        updatedNotes[existingIndex] = {
          occurrence: selectedOccurrence,
          authorId: 'current-user',
          content,
          actionItems,
          emailSentAt: new Date().toISOString(),
          createdAt: updatedNotes[existingIndex].createdAt,
          updatedAt: new Date().toISOString(),
        }
        setNotes(updatedNotes)
      } else {
        setNotes([
          ...notes,
          {
            occurrence: selectedOccurrence,
            authorId: 'current-user',
            content,
            actionItems,
            emailSentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  const selectedNote = notes.find(n => n.occurrence === selectedOccurrence)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Meeting Notes</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Select occurrence to add notes
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {pastOccurrences.map(occurrence => (
              <button
                key={occurrence}
                onClick={() => handleSelectOccurrence(occurrence)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedOccurrence === occurrence
                    ? 'bg-[#0D7377] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${selectedNote?.occurrence === occurrence ? 'ring-2 ring-[#0D7377]' : ''}`}
              >
                {new Date(occurrence).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                {selectedNote?.occurrence === occurrence && ' ✓'}
              </button>
            ))}
          </div>
        </div>

        {selectedOccurrence && (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Notes for {new Date(selectedOccurrence).toLocaleDateString()}
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Add meeting notes, decisions, and key points..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] font-mono text-sm"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Action Items
                </label>

                <div className="space-y-3 mb-4">
                  {actionItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleActionItem(item.id)}
                        className="w-5 h-5 mt-0.5"
                        disabled={saving}
                      />

                      <div className="flex-1">
                        <p className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.text}
                        </p>
                        {item.assigneeId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned to:{' '}
                            {attendees.find(a => a.uid === item.assigneeId)?.name || 'Unknown'}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={item.assigneeId || ''}
                          onChange={e =>
                            handleAssignActionItem(item.id, e.target.value || null)
                          }
                          className="text-xs px-2 py-1 border border-gray-300 rounded"
                          disabled={saving}
                        >
                          <option value="">Unassigned</option>
                          {attendees.map(attendee => (
                            <option key={attendee.uid} value={attendee.uid}>
                              {attendee.name}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleRemoveActionItem(item.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                          disabled={saving}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newActionItem}
                    onChange={e => setNewActionItem(e.target.value)}
                    placeholder="Add a new action item..."
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleAddActionItem()
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                    disabled={saving}
                  />
                  <button
                    onClick={handleAddActionItem}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50"
                    disabled={saving || !newActionItem.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveNotes}
                  disabled={saving || !content.trim()}
                  className="flex-1 px-6 py-3 bg-[#0D7377] text-white font-medium rounded-lg hover:bg-[#0a5f63] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Send to Attendees'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
