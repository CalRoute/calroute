'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface Props {
  bookingLinkSlug: string
}

export default function InvitePanel({ bookingLinkSlug }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${bookingLinkSlug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      showToast('Invite link copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Failed to copy link', 'error')
    }
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-[#0D7377] hover:text-[#0a5f63] font-medium transition-colors"
      >
        {isOpen ? 'Hide invite link' : 'Share link'}
      </button>

      {isOpen && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <p className="text-xs text-gray-600">Invite teammates to this booking link:</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 select-all"
            />
            <button
              onClick={handleCopy}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#0D7377] text-white hover:bg-[#0a5f63]'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
