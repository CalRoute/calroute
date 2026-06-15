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
  const [showEmbed, setShowEmbed] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const { showToast } = useToast()

  const bookingUrl = `${appUrl}/book/${slug}`
  const embedCode = `<iframe src="${appUrl}/embed/${slug}" width="100%" height="600" frameborder="0" style="border-radius:16px;"></iframe>`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Could not copy to clipboard', 'error')
    }
  }

  async function handleCopyEmbed() {
    try {
      await navigator.clipboard.writeText(embedCode)
      setEmbedCopied(true)
      showToast('Embed code copied', 'success')
      setTimeout(() => setEmbedCopied(false), 2000)
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
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        {/* Active toggle */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={active ? 'Deactivate link' : 'Activate link'}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
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

        {/* Embed */}
        <button
          onClick={() => setShowEmbed(v => !v)}
          title="Get embed code"
          className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap ${
            showEmbed
              ? 'border-[#0D7377]/40 text-[#0D7377] bg-[#0D7377]/5'
              : 'border-gray-200 text-gray-500 hover:text-gray-900'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25" />
          </svg>
          <span className="hidden sm:inline text-xs">Embed</span>
        </button>

        <a
          href={`/dashboard/links/${linkId}`}
          className="ml-auto text-sm text-white bg-[#0D7377] hover:bg-[#0a5f63] rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
        >
          Edit
        </a>
      </div>

      {/* Embed panel */}
      {showEmbed && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600">Embed on your website</p>
          <div className="flex gap-2 items-start">
            <code className="flex-1 text-[11px] font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 break-all leading-relaxed">
              {embedCode}
            </code>
            <button
              onClick={handleCopyEmbed}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                embedCopied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#0D7377] text-white hover:bg-[#0a5f63]'
              }`}
            >
              {embedCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Paste this anywhere — your website, Notion, or any HTML page.</p>
        </div>
      )}
    </div>
  )
}
