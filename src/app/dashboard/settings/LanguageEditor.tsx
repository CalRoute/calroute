'use client'

import { useState } from 'react'

const LANGUAGES = [
  'English', 'French', 'Spanish', 'Portuguese', 'German',
  'Italian', 'Dutch', 'Mandarin', 'Japanese', 'Arabic',
  'Hindi', 'Russian', 'Korean',
]

export default function LanguageEditor({ savedLanguages }: { savedLanguages: string[] }) {
  const [selected, setSelected] = useState<string[]>(savedLanguages)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(lang: string) {
    setSaved(false)
    setSelected(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        When visitors book, they&apos;ll be asked to pick a language. Only hosts who speak it will appear.
      </p>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map(lang => (
          <button
            key={lang}
            type="button"
            onClick={() => toggle(lang)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selected.includes(lang)
                ? 'bg-[#0D7377] text-white border-[#0D7377]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-[#0D7377] hover:text-[#0D7377]'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-[#0D7377] text-white rounded-xl text-sm font-medium hover:bg-[#0a5f63] disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save languages'}
      </button>
    </div>
  )
}
