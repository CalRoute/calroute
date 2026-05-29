'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DisconnectCalendarButton({ calendarId }: { calendarId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDisconnect() {
    if (!confirm('Disconnect this calendar?')) return
    setLoading(true)
    try {
      await fetch(`/api/calendars/${calendarId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDisconnect}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? 'Removing…' : 'Disconnect'}
    </button>
  )
}
