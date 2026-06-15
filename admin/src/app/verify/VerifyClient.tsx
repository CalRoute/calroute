'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function VerifyClient({ isSetup }: { isSetup: boolean }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [step, setStep] = useState<'qr' | 'code'>(isSetup ? 'qr' : 'code')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isSetup) {
      fetch('/api/auth/verify')
        .then(r => r.json())
        .then(data => { setQrDataUrl(data.qrDataUrl); setSecret(data.secret) })
    }
  }, [isSetup])

  useEffect(() => {
    if (step === 'code') setTimeout(() => inputRef.current?.focus(), 50)
  }, [step])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.replace(/\s/g, '').length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Invalid code')
        setCode('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (isSetup && step === 'qr') {
    return (
      <div className="space-y-6">
        {!qrDataUrl ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center">
              <Image src={qrDataUrl} alt="TOTP QR code" width={220} height={220} />
            </div>
            {secret && (
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">Can&apos;t scan? Enter this key manually:</p>
                <code className="text-[#0D7377] text-sm font-mono tracking-widest break-all">{secret}</code>
              </div>
            )}
            <button
              onClick={() => setStep('code')}
              className="w-full bg-[#0D7377] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#0a5f63] transition-colors"
            >
              I&apos;ve scanned it →
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      {isSetup && (
        <p className="text-gray-400 text-sm text-center">Enter the 6-digit code from your app to confirm setup</p>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000 000"
        value={code}
        onChange={e => setCode(e.target.value.replace(/[^0-9\s]/g, '').slice(0, 7))}
        className="w-full bg-white/5 border border-white/10 text-white text-center text-2xl font-mono tracking-[0.5em] rounded-xl px-4 py-4 placeholder:text-white/20 focus:outline-none focus:border-[#0D7377] focus:ring-1 focus:ring-[#0D7377] transition-colors"
      />
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading || code.replace(/\s/g, '').length !== 6}
        className="w-full bg-[#0D7377] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#0a5f63] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying…' : isSetup ? 'Confirm & enter admin' : 'Verify'}
      </button>
    </form>
  )
}
