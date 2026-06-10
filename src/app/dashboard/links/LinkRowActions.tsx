'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface Props {
  linkId: string
  slug: string
  isActive: boolean
  appUrl: string
}

export default function LinkRowActions({ linkId, slug, isActive: initialActive, appUrl }: Props) {
  const [active, setActive] = useState(initialActive)
  const [toggling, setToggling] = useState(false)
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const bookingUrl = `${appUrl}/book/${slug}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Could not copy to clipboard', 'error')
    }
  }

  async function handleToggle() {
    setToggling(true)
    const next = !active
    try {
      const res = await fetch(`/api/booking-links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      })
      if (!res.ok) throw new Error()
      setActive(next)
      showToast(next ? 'Link activated' : 'Link deactivated', 'success')
    } catch {
      showToast('Failed to update link', 'error')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Active toggle */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        title={active ? 'Deactivate link' : 'Activate link'}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          active ? 'bg-[#0D7377]' : 'bg-gray-200'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          active ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>

      {/* Copy link */}
      <button
        onClick={handleCopy}
        title="Copy booking URL"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-600 text-xs font-medium">Copied</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline text-xs">Copy</span>
          </>
        )}
      </button>
    </div>
  )
}
