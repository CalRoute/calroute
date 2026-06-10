'use client'

import { useState, useRef, useEffect } from 'react'

const LANGUAGES = [
  'English', 'French', 'Spanish', 'Portuguese', 'German',
  'Italian', 'Dutch', 'Mandarin', 'Japanese', 'Arabic',
  'Hindi', 'Russian', 'Korean',
]

export default function LanguageEditor({ savedLanguages }: { savedLanguages: string[] }) {
  const [selected, setSelected] = useState<string[]>(savedLanguages)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(lang: string) {
    setSaved(false)
    setSelected(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/hosts/me/languages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: selected }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      setSaved(true)
      setOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
        >
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {selected.length === 0 ? (
              <span className="text-gray-400">Select languages…</span>
            ) : (
              selected.map(lang => (
                <span key={lang} className="inline-flex items-center gap-1 bg-[#0D7377]/10 text-[#0D7377] text-xs font-medium px-2 py-0.5 rounded-full">
                  {lang}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); toggle(lang) }}
                    className="hover:text-[#0a5f63] leading-none"
                  >×</button>
                </span>
              ))
            )}
          </div>
          <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="max-h-52 overflow-y-auto py-1">
              {LANGUAGES.map(lang => {
                const isSelected = selected.includes(lang)
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggle(lang)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                      isSelected ? 'bg-[#0D7377]/5 text-[#0D7377]' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-[#0D7377] bg-[#0D7377]' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {lang}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {selected.length === 0 ? 'No languages selected' : `${selected.length} selected`}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#0D7377] text-white rounded-xl text-sm font-medium hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </div>
  )
}
