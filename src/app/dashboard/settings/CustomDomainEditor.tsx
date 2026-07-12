'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface Props {
  savedDomain: string | null
}

export default function CustomDomainEditor({ savedDomain }: Props) {
  const { showToast } = useToast()
  const [domain, setDomain] = useState(savedDomain ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    try {
      const res = await fetch('/api/hosts/me/custom-domain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain: cleaned || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to save domain', 'error')
        return
      }
      const data = await res.json()
      setDomain(data.customDomain ?? '')
      showToast(data.customDomain ? 'Custom domain saved' : 'Custom domain removed', 'success')
    } catch {
      showToast('Error saving domain', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setDomain('')
    setSaving(true)
    try {
      await fetch('/api/hosts/me/custom-domain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain: null }),
      })
      showToast('Custom domain removed', 'success')
    } catch {
      showToast('Error removing domain', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cnameTarget = 'cname.vercel-dns.com'

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="book.yourcompany.com"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-[#0D7377] text-white rounded-lg hover:bg-[#0a5f63] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {savedDomain && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {domain && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium text-gray-900">DNS setup required</p>
          <p className="text-gray-600">Add a CNAME record in your DNS provider:</p>
          <div className="font-mono bg-white border border-gray-200 rounded px-3 py-2 text-xs space-y-1">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-gray-500">Type</span>
              <span>CNAME</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-gray-500">Name</span>
              <span>{domain.split('.').slice(0, -2).join('.') || domain}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-gray-500">Value</span>
              <span className="text-[#0D7377]">{cnameTarget}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            DNS changes can take up to 24 hours to propagate. Once active, visitors to{' '}
            <span className="font-medium text-gray-700">{domain}</span> will see your booking page.
          </p>
        </div>
      )}
    </div>
  )
}
