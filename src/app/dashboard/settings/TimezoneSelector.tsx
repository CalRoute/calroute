'use client'

import { useState, useRef, useEffect } from 'react'

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

export default function TimezoneSelector({ savedTimezone }: { savedTimezone: string }) {
  const [timezone, setTimezone] = useState(savedTimezone)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10)
  }, [open])

  const filtered = TIMEZONES.filter(tz =>
    tz.toLowerCase().includes(query.toLowerCase()) ||
    formatLabel(tz).toLowerCase().includes(query.toLowerCase())
  )

  function select(tz: string) {
    setTimezone(tz)
    setSaved(false)
    setOpen(false)
    setQuery('')
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/hosts/me/timezone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      setSaved(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2.5">
      <div ref={containerRef} className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm transition-all bg-white ${
            open ? 'border-[#0D7377] ring-2 ring-[#0D7377]/15' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-semibold text-[#0D7377] bg-[#0D7377]/10 px-2 py-0.5 rounded-md flex-shrink-0">
              {getOffset(timezone)}
            </span>
            <span className="text-gray-800 font-medium truncate">{formatLabel(timezone)}</span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search timezone…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">No results</p>
              ) : (
                filtered.map(tz => (
                  <button
                    key={tz}
                    type="button"
                    onClick={() => select(tz)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                      tz === timezone
                        ? 'bg-[#0D7377]/8 text-[#0D7377]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs font-semibold w-16 flex-shrink-0 ${tz === timezone ? 'text-[#0D7377]' : 'text-gray-400'}`}>
                      {getOffset(tz)}
                    </span>
                    <span className={`truncate ${tz === timezone ? 'font-medium' : ''}`}>
                      {formatLabel(tz)}
                    </span>
                    {tz === timezone && (
                      <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || saved}
        className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${
          saved
            ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
            : 'bg-[#0D7377] text-white hover:bg-[#0a5f63] disabled:opacity-50'
        }`}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save timezone'}
      </button>
    </div>
  )
}
