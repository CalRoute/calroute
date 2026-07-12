'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface Props {
  savedDomain: string | null
  pendingDomain: string | null
  verifyToken: string | null
}

type VerifyStatus = 'idle' | 'checking' | 'verified' | 'failed'

export default function CustomDomainEditor({ savedDomain, pendingDomain, verifyToken: initialToken }: Props) {
  const { showToast } = useToast()
  const [input, setInput] = useState(savedDomain ?? pendingDomain ?? '')
  const [activeDomain, setActiveDomain] = useState(savedDomain ?? null)
  const [pending, setPending] = useState(pendingDomain ?? null)
  const [token, setToken] = useState(initialToken ?? null)
  const [saving, setSaving] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')

  const handleSave = async () => {
    setSaving(true)
    setVerifyStatus('idle')
    const cleaned = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
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
      if (data.customDomain === null && !data.pending) {
        setActiveDomain(null)
        setPending(null)
        setToken(null)
        setInput('')
        showToast('Custom domain removed', 'success')
      } else {
        setActiveDomain(null)
        setPending(data.pending)
        setToken(data.token)
        showToast('Domain saved — add the TXT record below to verify ownership', 'success')
      }
    } catch {
      showToast('Error saving domain', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setSaving(true)
    setVerifyStatus('idle')
    try {
      await fetch('/api/hosts/me/custom-domain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain: null }),
      })
      setActiveDomain(null)
      setPending(null)
      setToken(null)
      setInput('')
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
      if (data.verified) {
        setVerifyStatus('verified')
        setActiveDomain(data.customDomain)
        setPending(null)
        setToken(null)
      } else {
        setVerifyStatus('failed')
      }
    } catch {
      setVerifyStatus('failed')
    }
  }

  const cnameTarget = 'cname.vercel-dns.com'

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
        {(activeDomain || pending) && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {/* Verified and active */}
      {activeDomain && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-green-800 font-medium">Verified and active</span>
          </div>
          <p className="text-green-700">
            Visitors to <span className="font-medium">{activeDomain}</span> will see your booking page.
          </p>
          <div className="border-t border-green-200 pt-3 space-y-1">
            <p className="text-green-800 font-medium text-xs">CNAME record (keep this in place)</p>
            <div className="font-mono bg-white border border-green-200 rounded px-3 py-2 text-xs space-y-1">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-gray-500">Type</span><span>CNAME</span>
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
          </div>
        </div>
      )}

      {/* Pending verification */}
      {pending && token && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            <span className="text-gray-800 font-medium">Verification required</span>
          </div>

          <p className="text-gray-600">
            Add these two DNS records for <span className="font-medium text-gray-900">{pending}</span>, then click Verify ownership below.
          </p>

          {/* Step 1: TXT */}
          <div className="space-y-1">
            <p className="font-medium text-gray-800 text-xs uppercase tracking-wide">Step 1 — Prove ownership (TXT record)</p>
            <div className="font-mono bg-white border border-gray-200 rounded px-3 py-2 text-xs space-y-1">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-gray-500">Type</span><span>TXT</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-gray-500">Name</span>
                <span>{pending.split('.').slice(0, -2).join('.') || '@'}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 break-all">
                <span className="text-gray-500">Value</span>
                <span className="text-[#0D7377] break-all">{token}</span>
              </div>
            </div>
          </div>

          {/* Step 2: CNAME */}
          <div className="space-y-1">
            <p className="font-medium text-gray-800 text-xs uppercase tracking-wide">Step 2 — Point to CalRoute (CNAME record)</p>
            <div className="font-mono bg-white border border-gray-200 rounded px-3 py-2 text-xs space-y-1">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-gray-500">Type</span><span>CNAME</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-gray-500">Name</span>
                <span>{pending.split('.').slice(0, -2).join('.') || pending}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-gray-500">Value</span>
                <span className="text-[#0D7377]">{cnameTarget}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">DNS changes can take up to 24 hours to propagate.</p>

          {/* Verify button + status */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleVerify}
              disabled={verifyStatus === 'checking'}
              className="px-4 py-2 text-sm font-medium bg-[#0D7377] text-white rounded-lg hover:bg-[#0a5f63] transition-colors disabled:opacity-50"
            >
              {verifyStatus === 'checking' ? 'Checking...' : 'Verify ownership'}
            </button>
            {verifyStatus === 'failed' && (
              <span className="text-xs text-yellow-700">TXT record not found yet — try again in a few minutes.</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
