'use client'

import { useState } from 'react'

export default function CancelButton({ bookingId, token }: { bookingId: string; token: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleCancel() {
    setState('loading')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error ?? 'Failed to cancel'); setState('error'); return }
      setState('done')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="text-center space-y-2 py-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900">Booking cancelled</p>
        <p className="text-sm text-gray-500">A confirmation has been sent to your email.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {state === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{errorMsg}</p>
      )}
      <button
        onClick={handleCancel}
        disabled={state === 'loading'}
        className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
      >
        {state === 'loading' ? 'Cancelling…' : 'Yes, cancel this meeting'}
      </button>
      <button
        onClick={() => history.back()}
        className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
      >
        Keep my meeting
      </button>
    </div>
  )
}
