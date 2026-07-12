'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface Props {
  savedDomain: string | null
}

type VerifyStatus = 'idle' | 'checking' | 'connected' | 'not_connected'

export default function CustomDomainEditor({ savedDomain }: Props) {
  const { showToast } = useToast()
  const [domain, setDomain] = useState(savedDomain ?? '')
  const [activeDomain, setActiveDomain] = useState(savedDomain ?? '')
  const [saving, setSaving] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')

  const handleSave = async () => {
    setSaving(true)
    setVerifyStatus('idle')
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
      setActiveDomain(data.customDomain ?? '')
      showToast(data.customDomain ? 'Custom domain saved' : 'Custom domain removed', 'success')
    } catch {
      showToast('Error saving domain', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setDomain('')
    setActiveDomain('')
    setVerifyStatus('idle')
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

  const handleVerify = async () => {
    setVerifyStatus('checking')
    try {
      const res = await fetch('/api/hosts/me/custom-domain/verify')
      const data = await res.json()
      setVerifyStatus(data.connected ? 'connected' : 'not_connected')
    } catch {
      setVerifyStatus('not_connected')
    }
  }

  const cnameTarget = 'cname.vercel-dns.com'

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={domain}
          onChange={(e) => { setDomain(e.target.value); setVerifyStatus('idle') }}
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
        {activeDomain && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {activeDomain && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-sm">
          {/* Connection status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {verifyStatus === 'connected' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  <span className="text-green-700 font-medium">Connected</span>
                </>
              )}
              {verifyStatus === 'not_connected' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                  <span className="text-yellow-700 font-medium">Not active yet</span>
                  <span className="text-gray-500">— DNS may still be propagating</span>
                </>
              )}
              {verifyStatus === 'checking' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-300 inline-block animate-pulse" />
                  <span className="text-gray-500">Checking...</span>
                </>
              )}
              {verifyStatus === 'idle' && (
                <span className="text-gray-500">Domain saved. Check if DNS is active.</span>
              )}
            </div>
            <button
              onClick={handleVerify}
              disabled={verifyStatus === 'checking'}
              className="text-xs font-medium text-[#0D7377] hover:underline disabled:opacity-50"
            >
              {verifyStatus === 'checking' ? 'Checking...' : 'Check connection'}
            </button>
          </div>

          {/* DNS instructions */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <p className="font-medium text-gray-900">DNS setup</p>
            <p className="text-gray-600">Add this CNAME record in your DNS provider:</p>
            <div className="font-mono bg-white border border-gray-200 rounded px-3 py-2 text-xs space-y-1">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-gray-500">Type</span>
                <span>CNAME</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-gray-500">Name</span>
                <span>{activeDomain.split('.').slice(0, -2).join('.') || activeDomain}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-gray-500">Value</span>
                <span className="text-[#0D7377]">{cnameTarget}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              DNS changes can take up to 24 hours to propagate. Once active, visitors to{' '}
              <span className="font-medium text-gray-700">{activeDomain}</span> will see your booking page.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
