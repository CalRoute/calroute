'use client'

import { useEffect, useState, Suspense } from 'react'
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase/client'
import { useRouter, useSearchParams } from 'next/navigation'

async function createServerSession(idToken: string): Promise<boolean> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.error('[login] session error:', body)
    return false
  }
  return true
}

function LoginForm() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') ?? '/dashboard'

  useEffect(() => {
    let cancelled = false

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe()
      if (cancelled) return

      if (user) {
        try {
          const idToken = await user.getIdToken(true)
          const ok = await createServerSession(idToken)
          if (cancelled) return
          if (ok) { router.push(returnTo); return }
        } catch {
          // Token refresh failed — fall through to show the button
        }
      }

      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [router, returnTo])

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const ok = await createServerSession(idToken)
      if (ok) {
        router.push(returnTo)
      } else {
        setError('Sign in failed. Please try again.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('[login] signInWithPopup error:', err)
      setError(err?.message ?? 'Sign in failed. Please try again.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#1a1a1a]/[0.06] p-8 text-center">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">CalRoute</h1>
        <p className="text-[#1a1a1a]/40 text-sm">Signing you in…</p>
        <div className="mt-6 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#1a1a1a]/10 border-t-[#0D7377] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#1a1a1a]/[0.06] p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">CalRoute</h1>
        <p className="text-[#1a1a1a]/40 text-sm mt-1">Smart scheduling for teams</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-[#1a1a1a]/10 rounded-xl text-sm font-medium text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/[0.03] transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-xs text-[#1a1a1a]/30 mt-6">
        By signing in you agree to our Terms of Service.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#1a1a1a]/[0.06] p-8 text-center">
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">CalRoute</h1>
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#1a1a1a]/10 border-t-[#0D7377] rounded-full animate-spin" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </main>
  )
}
