'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface Props {
  firstLinkSlug: string | null
}

export default function InviteDashboardAction({ firstLinkSlug }: Props) {
  const { showToast } = useToast()
  const [copying, setCopying] = useState(false)

  const handleCopy = async () => {
    if (!firstLinkSlug) return

    setCopying(true)
    try {
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/book/${firstLinkSlug}`
      await navigator.clipboard.writeText(url)
      showToast('Booking link copied', 'success')
    } catch {
      showToast('Failed to copy link', 'error')
    } finally {
      setCopying(false)
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={!firstLinkSlug || copying}
      className="bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {copying ? 'Copying…' : 'Share booking link'}
    </button>
  )
}
