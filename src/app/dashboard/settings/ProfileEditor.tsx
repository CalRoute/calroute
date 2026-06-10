'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface Props {
  savedName: string
  email: string
}

export default function ProfileEditor({ savedName, email }: Props) {
  const [name, setName] = useState(savedName)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/hosts/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) throw new Error('Failed to save')
      showToast('Profile updated', 'success')
    } catch (error) {
      showToast('Failed to update profile', 'error')
      setName(savedName)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Cannot be changed</p>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={loading || name === savedName}
        className="px-4 py-2 bg-[#0D7377] text-white rounded-lg text-sm font-medium hover:bg-[#0a5f63] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
