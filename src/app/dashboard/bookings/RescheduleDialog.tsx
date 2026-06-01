'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface Props {
  onClose: () => void
  onConfirm: (newStartTime: string) => void
  isLoading: boolean
  count: number
}

export default function RescheduleDialog({ onClose, onConfirm, isLoading, count }: Props) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState('14:00')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newStartTime = new Date(`${date}T${time}:00`).toISOString()
    onConfirm(newStartTime)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Reschedule {count} booking{count !== 1 ? 's' : ''}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
            />
          </div>

          <p className="text-xs text-gray-500">All bookings will be moved to {format(new Date(`${date}T${time}:00`), 'MMM d, yyyy h:mm a')}</p>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
