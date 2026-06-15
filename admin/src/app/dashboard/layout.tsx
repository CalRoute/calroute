import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/session'
import LogoutButton from './LogoutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession()

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0D7377] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-2.126-.556-4.123-1.532-5.862A12 12 0 0112 2.714z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">CalRoute Admin</span>
              <span className="ml-2 text-xs text-gray-400 hidden sm:inline">admin.calroute.me</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[200px]">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
