import Link from 'next/link'

interface Props {
  children: React.ReactNode
  user?: { email: string; name?: string }
}

export default function DashboardLayout({ children, user }: Props) {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/bookings', label: 'Bookings', icon: '📅' },
    { href: '/dashboard/team', label: 'Team', icon: '👥' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="flex min-h-screen bg-[#F7F4EF]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-200">
          <Link href="/" className="text-xl font-bold text-gray-900">
            CalRoute
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
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
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="max-w-7xl">
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
