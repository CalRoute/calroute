'use client'

import { useState } from 'react'
import { getClientToken } from '@/lib/firebase/getClientToken'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DEFAULT_AVAILABILITY = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', enabled: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', enabled: false },
  { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', enabled: false },
]

function mergeAvailability(saved: any[]) {
  return DEFAULT_AVAILABILITY.map(def => {
    const found = saved.find((s: any) => s.dayOfWeek === def.dayOfWeek)
    return found ? { ...found, enabled: true } : def
  })
}

export default function AvailabilityEditor({ savedAvailability }: { savedAvailability: any[] }) {
  const [availability, setAvailability] = useState(mergeAvailability(savedAvailability))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(index: number, field: string, value: any) {
    setSaved(false)
    setAvailability(prev => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const idToken = await getClientToken()
      const res = await fetch('/api/hosts/me/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ availability: availability.filter(a => a.enabled) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      setSaved(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {availability.map((a, i) => (
          <div key={a.dayOfWeek} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => update(i, 'enabled', !a.enabled)}
                className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${a.enabled ? 'bg-[#0D7377]' : 'bg-gray-200'}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full shadow mx-auto transition-transform ${a.enabled ? 'translate-x-2' : '-translate-x-2'}`} />
              </button>
              <span className={`w-10 text-sm font-medium ${a.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                {DAYS[a.dayOfWeek]}
              </span>
            </div>
            {a.enabled ? (
              <div className="flex items-center gap-2 flex-1 pl-13 sm:pl-0">
                <input type="time" value={a.startTime}
                  onChange={e => update(i, 'startTime', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] min-w-0"
                />
                <span className="text-gray-400 text-sm flex-shrink-0">to</span>
                <input type="time" value={a.endTime}
                  onChange={e => update(i, 'endTime', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] min-w-0"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400 pl-13 sm:pl-0">Unavailable</span>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-[#0D7377] text-white rounded-xl text-sm font-medium hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save availability'}
      </button>
    </div>
  )
}
