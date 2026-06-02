'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BillingSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/settings')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription confirmed!</h1>
          <p className="text-gray-600">Thank you for upgrading. Your billing information has been saved.</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Redirecting to settings in 3 seconds...</p>
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#0D7377] animate-pulse" style={{ animation: 'width 3s linear' }} />
          </div>
        </div>

        <p className="text-xs text-gray-400">
          or{' '}
          <Link href="/dashboard/settings" className="text-[#0D7377] hover:underline">
            go to settings now
          </Link>
        </p>
      </div>
    </div>
  )
}
