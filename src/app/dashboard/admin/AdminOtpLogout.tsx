'use client'

import { useRouter } from 'next/navigation'

export default function AdminOtpLogout() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin-auth/logout', { method: 'POST' })
    router.push('/dashboard')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
      </svg>
      End admin session
    </button>
  )
}
