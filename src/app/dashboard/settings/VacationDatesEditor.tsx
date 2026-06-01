'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useToast } from '@/components/Toast'

interface VacationDate {
  id: string
  startDate: string
  endDate: string
  reason?: string
}

interface Props {
  savedDates: VacationDate[]
}

export default function VacationDatesEditor({ savedDates }: Props) {
  const { showToast } = useToast()
  const [dates, setDates] = useState<VacationDate[]>(savedDates)
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [newReason, setNewReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const addDateRange = () => {
    if (!newStart || !newEnd) {
      showToast('Start and end dates required', 'error')
      return
    }
    if (newStart > newEnd) {
      showToast('End date must be after start date', 'error')
      return
    }
    const id = `temp_${Date.now()}`
    setDates([...dates, { id, startDate: newStart, endDate: newEnd, reason: newReason || undefined }])
    setNewStart('')
    setNewEnd('')
    setNewReason('')
    setSaved(false)
  }

  const removeDate = (id: string) => {
    setDates(dates.filter(d => d.id !== id))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/hosts/me/blackout-dates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to save dates', 'error')
        return
      }

      setSaved(true)
      showToast('Vacation dates saved', 'success')
    } catch (error) {
      showToast('Error saving dates', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Reason (optional)</label>
          <input
            type="text"
            placeholder="e.g., Annual vacation, Conference"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
          />
        </div>
        <button
          onClick={addDateRange}
          className="w-full px-3 py-2 text-sm font-medium text-[#0D7377] bg-white border border-[#0D7377] rounded-lg hover:bg-[#0D7377]/5 transition-colors"
        >
          + Add vacation dates
        </button>
      </div>

      {dates.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">No vacation dates set. Guests can book anytime.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dates.map(date => (
            <div key={date.id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {format(parseISO(date.startDate), 'MMM d')} — {format(parseISO(date.endDate), 'MMM d, yyyy')}
                </p>
                {date.reason && <p className="text-xs text-gray-600 mt-1">{date.reason}</p>}
              </div>
              <button
                onClick={() => removeDate(date.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium whitespace-nowrap"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          saving
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : saved
              ? 'bg-green-50 text-green-600'
              : 'bg-[#0D7377] text-white hover:bg-[#0a5f63]'
        }`}
      >
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save vacation dates'}
      </button>
    </div>
  )
}
