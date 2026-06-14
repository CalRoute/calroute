'use client'

import { useState } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Range = { startTime: string; endTime: string }
type DayConfig = { dayOfWeek: number; enabled: boolean; ranges: Range[] }

const DEFAULT_RANGE: Range = { startTime: '09:00', endTime: '17:00' }

const DEFAULT_DAYS: DayConfig[] = [
  { dayOfWeek: 1, enabled: true,  ranges: [{ startTime: '09:00', endTime: '17:00' }] },
  { dayOfWeek: 2, enabled: true,  ranges: [{ startTime: '09:00', endTime: '17:00' }] },
  { dayOfWeek: 3, enabled: true,  ranges: [{ startTime: '09:00', endTime: '17:00' }] },
  { dayOfWeek: 4, enabled: true,  ranges: [{ startTime: '09:00', endTime: '17:00' }] },
  { dayOfWeek: 5, enabled: true,  ranges: [{ startTime: '09:00', endTime: '17:00' }] },
  { dayOfWeek: 6, enabled: false, ranges: [{ startTime: '09:00', endTime: '17:00' }] },
  { dayOfWeek: 0, enabled: false, ranges: [{ startTime: '09:00', endTime: '17:00' }] },
]

function mergeAvailability(saved: any[]): DayConfig[] {
  return DEFAULT_DAYS.map(def => {
    const found = saved.find(s => s.dayOfWeek === def.dayOfWeek)
    if (!found) return def

    // Handle old single-range format
    if (found.startTime && !found.ranges) {
      return { ...def, enabled: true, ranges: [{ startTime: found.startTime, endTime: found.endTime }] }
    }
    // New multi-range format
    if (Array.isArray(found.ranges) && found.ranges.length > 0) {
      return { ...def, enabled: true, ranges: found.ranges }
    }
    return def
  })
}

export default function AvailabilityEditor({ savedAvailability }: { savedAvailability: any[] }) {
  const [days, setDays] = useState<DayConfig[]>(mergeAvailability(savedAvailability))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleDay(i: number) {
    setSaved(false)
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, enabled: !d.enabled } : d))
  }

  function updateRange(dayIdx: number, rangeIdx: number, field: keyof Range, value: string) {
    setSaved(false)
    setDays(prev => prev.map((d, i) =>
      i !== dayIdx ? d : {
        ...d,
        ranges: d.ranges.map((r, ri) => ri === rangeIdx ? { ...r, [field]: value } : r),
      }
    ))
  }

  function addRange(dayIdx: number) {
    setSaved(false)
    setDays(prev => prev.map((d, i) =>
      i !== dayIdx ? d : { ...d, ranges: [...d.ranges, { ...DEFAULT_RANGE }] }
    ))
  }

  function removeRange(dayIdx: number, rangeIdx: number) {
    setSaved(false)
    setDays(prev => prev.map((d, i) =>
      i !== dayIdx ? d : { ...d, ranges: d.ranges.filter((_, ri) => ri !== rangeIdx) }
    ))
  }

  function mergeRanges(ranges: Range[]): Range[] {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }
    const fromMinutes = (m: number) => {
      const h = Math.floor(m / 60).toString().padStart(2, '0')
      const min = (m % 60).toString().padStart(2, '0')
      return `${h}:${min}`
    }
    const sorted = [...ranges].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
    const merged: Range[] = []
    for (const r of sorted) {
      const last = merged[merged.length - 1]
      if (last && toMinutes(r.startTime) <= toMinutes(last.endTime)) {
        last.endTime = fromMinutes(Math.max(toMinutes(last.endTime), toMinutes(r.endTime)))
      } else {
        merged.push({ ...r })
      }
    }
    return merged
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const availability = days
        .filter(d => d.enabled && d.ranges.length > 0)
        .map(d => ({ dayOfWeek: d.dayOfWeek, ranges: mergeRanges(d.ranges) }))

      const res = await fetch('/api/hosts/me/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }

      // Sync UI to exactly what was saved (merged ranges applied)
      setDays(prev => prev.map(d => {
        const saved = availability.find(a => a.dayOfWeek === d.dayOfWeek)
        if (!saved) return { ...d, enabled: false }
        return { ...d, enabled: true, ranges: saved.ranges }
      }))

      setSaved(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-0.5">
      {days.map((day, dayIdx) => (
        <div key={day.dayOfWeek} className="flex items-center gap-3 py-1.5">
          {/* Toggle */}
          <button
            type="button"
            onClick={() => toggleDay(dayIdx)}
            className={`w-8 h-4.5 rounded-full transition-colors flex-shrink-0 relative ${day.enabled ? 'bg-[#0D7377]' : 'bg-gray-200'}`}
            style={{ width: 32, height: 18 }}
          >
            <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${day.enabled ? 'left-[15px]' : 'left-0.5'}`} />
          </button>

          {/* Day label */}
          <span className={`text-sm font-medium w-8 flex-shrink-0 ${day.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {DAYS[day.dayOfWeek]}
          </span>

          {/* Ranges or unavailable */}
          {!day.enabled ? (
            <span className="text-sm text-gray-400">Unavailable</span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              {day.ranges.map((range, rangeIdx) => (
                <div key={rangeIdx} className="flex items-center gap-1">
                  <input
                    type="time"
                    value={range.startTime}
                    onChange={e => updateRange(dayIdx, rangeIdx, 'startTime', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377] bg-white w-28"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="time"
                    value={range.endTime}
                    onChange={e => updateRange(dayIdx, rangeIdx, 'endTime', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377] bg-white w-28"
                  />
                  {day.ranges.length > 1 && (
                    <button type="button" onClick={() => removeRange(dayIdx, rangeIdx)}
                      className="text-gray-300 hover:text-red-400 transition-colors ml-0.5" title="Remove">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addRange(dayIdx)}
                className="text-xs text-[#0D7377] hover:text-[#0a5f63] font-medium px-1.5 py-1 rounded-lg hover:bg-[#0D7377]/5 transition-colors"
                title="Add time block"
              >
                + Add
              </button>
            </div>
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-600 pt-1">{error}</p>}

      <div className="pt-3">
        <button type="button" onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-[#0D7377] text-white rounded-xl text-sm font-medium hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save availability'}
        </button>
      </div>
    </div>
  )
}
