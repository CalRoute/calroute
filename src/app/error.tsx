'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-3">Something went wrong</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Unexpected error</h1>
      <p className="text-gray-500 text-base max-w-sm mb-8">
        An unexpected error occurred. Our team has been notified. Try refreshing the page or head back to safety.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="bg-[#0D7377] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0a5f63] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
