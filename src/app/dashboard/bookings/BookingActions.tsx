'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookingActions({ bookingId, customerEmail }: { bookingId: string; customerEmail: string }) {
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCancel() {
    if (!confirm(`Cancel this booking with ${customerEmail}?`)) return
    setCancelling(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // no token = host auth via session
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to cancel'); setCancelling(false); return }
      router.refresh()
    } catch {
      setError('Something went wrong.')
      setCancelling(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-xs text-red-600 flex-1">{error}</p>}
      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
      >
        {cancelling ? 'Cancelling…' : 'Cancel'}
      </button>
    </div>
  )
}
