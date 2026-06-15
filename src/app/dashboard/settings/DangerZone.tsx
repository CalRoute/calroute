'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

export default function DangerZone() {
  const { showToast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== 'delete my account') return
    setDeleting(true)
    try {
      const res = await fetch('/api/hosts/me', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Failed to delete account', 'error')
        setDeleting(false)
        return
      }
      // Account deleted — redirect to home
      window.location.href = '/'
    } catch {
      showToast('Something went wrong. Please try again.', 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-red-200 p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-red-700">Danger Zone</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Permanent actions that cannot be undone.
        </p>
      </div>

      <div className="border border-red-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Delete account</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Permanently deletes your profile, all booking links, bookings, and cancels any active subscription.
          </p>
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="flex-shrink-0 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-xl hover:bg-red-50 transition-colors"
          >
            Delete account
          </button>
        ) : (
          <div className="flex flex-col gap-2 w-full sm:max-w-xs">
            <p className="text-xs text-gray-600">
              Type <span className="font-mono font-semibold">delete my account</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete my account"
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'delete my account' || deleting}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button
                onClick={() => { setConfirming(false); setConfirmText('') }}
                disabled={deleting}
                className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
