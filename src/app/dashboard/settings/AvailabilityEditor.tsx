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

      // Update UI to reflect merged ranges
      setDays(prev => prev.map(d => {
        if (!d.enabled) return d
        const merged = mergeRanges(d.ranges)
        return merged.length !== d.ranges.length ? { ...d, ranges: merged } : d
      }))

      const res = await fetch('/api/hosts/me/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
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
    <div className="space-y-1">
      {days.map((day, dayIdx) => (
        <div key={day.dayOfWeek} className={`rounded-xl px-3 py-2.5 transition-colors ${day.enabled ? 'bg-gray-50' : ''}`}>
          <div className="flex items-start gap-3">
            {/* Toggle + day name */}
            <div className="flex items-center gap-2.5 pt-0.5 min-w-[72px] flex-shrink-0">
              <button
                type="button"
                onClick={() => toggleDay(dayIdx)}
                className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${day.enabled ? 'bg-[#0D7377]' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${day.enabled ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
              <span className={`text-sm font-medium w-7 ${day.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                {DAYS[day.dayOfWeek]}
              </span>
            </div>

            {/* Ranges or unavailable */}
            {!day.enabled ? (
              <span className="text-sm text-gray-400 pt-0.5">Unavailable</span>
            ) : (
              <div className="flex-1 space-y-1.5">
                {day.ranges.map((range, rangeIdx) => (
                  <div key={rangeIdx} className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={range.startTime}
                      onChange={e => updateRange(dayIdx, rangeIdx, 'startTime', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377] min-w-0 bg-white"
                    />
                    <span className="text-gray-400 text-xs flex-shrink-0">–</span>
                    <input
                      type="time"
                      value={range.endTime}
                      onChange={e => updateRange(dayIdx, rangeIdx, 'endTime', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377] min-w-0 bg-white"
                    />
                    {day.ranges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRange(dayIdx, rangeIdx)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors rounded"
                        title="Remove"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {day.ranges.length === 1 && <div className="w-6 flex-shrink-0" />}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addRange(dayIdx)}
                  className="text-xs text-[#0D7377] hover:text-[#0a5f63] font-medium transition-colors"
                >
                  + Add block
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-600 pt-1">{error}</p>}

      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-[#0D7377] text-white rounded-xl text-sm font-medium hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save availability'}
        </button>
      </div>
    </div>
  )
}
