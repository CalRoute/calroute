'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/client'

export default function DisconnectCalendarButton({
  calendarId,
  hostId,
}: {
  calendarId: string
  hostId: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDisconnect() {
    if (!confirm('Disconnect this calendar?')) return
    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) return
      const idToken = await user.getIdToken()
      await fetch(`/api/calendars/${calendarId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })
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
