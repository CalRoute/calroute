'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Props {
  children: React.ReactNode
  user?: { email: string; name?: string }
}

export default function DashboardLayout({ children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/bookings', label: 'Bookings', icon: '📅' },
    { href: '/dashboard/team', label: 'Team', icon: '👥' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="flex min-h-screen bg-[#F7F4EF]">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-40 md:hidden">
        <Link href="/" className="flex items-center gap-2 h-8">
          <svg viewBox="0 0 100 100" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="mobFaviconGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <g transform="translate(15, 12)">
              <rect x="0" y="8" width="70" height="72" rx="14" fill="#1e293b" />
              <path d="M 0 20 L 70 20 L 70 20 C 70 13.37, 63.63 8, 56 8 L 14 8 C 6.37 8, 0 13.37, 0 20 Z" fill="#334155" />
              <rect x="16" y="0" width="8" height="14" rx="4" fill="#64748b" />
              <rect x="46" y="0" width="8" height="14" rx="4" fill="#64748b" />
              <path d="M 12 56 C 24 56, 26 38, 44 38" fill="none" stroke="url(#mobFaviconGrad)" strokeWidth="7" strokeLinecap="round" />
              <rect x="36" y="30" width="16" height="16" rx="4" fill="none" stroke="#ffffff" strokeWidth="3" />
              <circle cx="44" cy="38" r="3.5" fill="#ffffff" />
              <path d="M 44 38 L 78 38" fill="none" stroke="url(#mobFaviconGrad)" strokeWidth="7" strokeLinecap="round" />
              <path d="M 69 30 L 78 38 L 69 46" fill="none" stroke="url(#mobFaviconGrad)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
          <span className="text-lg font-bold text-gray-900">CalRoute</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 transform transition-transform duration-300 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:top-0`}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2 group">
            <svg viewBox="0 0 100 100" className="w-10 h-10 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sideFaviconGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <g transform="translate(15, 12)">
                <rect x="0" y="8" width="70" height="72" rx="14" fill="#1e293b" />
                <path d="M 0 20 L 70 20 L 70 20 C 70 13.37, 63.63 8, 56 8 L 14 8 C 6.37 8, 0 13.37, 0 20 Z" fill="#334155" />
                <rect x="16" y="0" width="8" height="14" rx="4" fill="#64748b" />
                <rect x="46" y="0" width="8" height="14" rx="4" fill="#64748b" />
                <path d="M 12 56 C 24 56, 26 38, 44 38" fill="none" stroke="url(#sideFaviconGrad)" strokeWidth="7" strokeLinecap="round" />
                <rect x="36" y="30" width="16" height="16" rx="4" fill="none" stroke="#ffffff" strokeWidth="3" />
                <circle cx="44" cy="38" r="3.5" fill="#ffffff" />
                <path d="M 44 38 L 78 38" fill="none" stroke="url(#sideFaviconGrad)" strokeWidth="7" strokeLinecap="round" />
                <path d="M 69 30 L 78 38 L 69 46" fill="none" stroke="url(#sideFaviconGrad)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
            <span className="text-lg font-bold text-gray-900 group-hover:text-[#3b82f6] transition-colors">CalRoute</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="px-4 py-6 border-t border-gray-200 space-y-3">
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase">Logged in as</p>
              <p className="text-sm font-medium text-gray-900 truncate mt-1">{user.name || user.email}</p>
            </div>
            <Link
              href="/api/auth/logout"
              className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg text-center transition-colors"
            >
              Sign out
            </Link>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col pt-16 md:pt-0">
        {/* Top bar — desktop only */}
        <div className="hidden md:block bg-white border-b border-gray-200 px-6 lg:px-8 py-4">
          <div className="max-w-7xl">
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
