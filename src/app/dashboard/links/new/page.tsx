'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LinkTypePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#F7F4EF]">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          ← Back
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">What type of link?</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a booking link</h1>
          <p className="text-gray-500">Choose how you want to set this up</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Personal Link */}
          <button
            onClick={() => router.push('/dashboard/links/new/personal')}
            className="text-left p-6 sm:p-7 bg-white rounded-2xl border-2 border-gray-200 hover:border-[#0D7377] hover:bg-[#0D7377]/5 transition-all group"
          >
            <div className="w-12 h-12 bg-[#0D7377]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0D7377]/20 transition-colors">
              <svg className="w-6 h-6 text-[#0D7377]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Personal link</h2>
            <p className="text-sm text-gray-500 mb-4">
              Just you. Quick setup, ready to share immediately.
            </p>
            <div className="text-xs text-[#0D7377] font-medium">Get started →</div>
          </button>

          {/* Team Link */}
          <button
            onClick={() => router.push('/dashboard/links/new/team')}
            className="text-left p-6 sm:p-7 bg-white rounded-2xl border-2 border-gray-200 hover:border-[#0D7377] hover:bg-[#0D7377]/5 transition-all group"
          >
            <div className="w-12 h-12 bg-[#0D7377]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0D7377]/20 transition-colors">
              <svg className="w-6 h-6 text-[#0D7377]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Team link</h2>
            <p className="text-sm text-gray-500 mb-4">
              With colleagues. Set routing rules, team name, and more.
            </p>
            <div className="text-xs text-[#0D7377] font-medium">Create team link →</div>
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Can't decide?{' '}
            <button
              onClick={() => router.push('/dashboard/links/new/personal')}
              className="text-[#0D7377] hover:underline font-medium"
            >
              Start personal and add team members later
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
