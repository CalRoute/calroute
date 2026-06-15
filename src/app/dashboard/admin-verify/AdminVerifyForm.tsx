'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminVerifyForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.replace(/\s/g, '').length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin-auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (res.ok) {
        router.push('/dashboard/admin')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
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
        {error && (
          <p className="text-red-400 text-sm text-center mt-2">{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || code.replace(/\s/g, '').length !== 6}
        className="w-full bg-[#0D7377] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#0a5f63] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying…' : 'Verify'}
      </button>
    </form>
  )
}
