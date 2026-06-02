'use client'

import { useState } from 'react'

interface UserDetails {
  uid: string
  email: string
  name: string
  timezone: string
  createdAt: string
  links: Array<{
    id: string
    title: string
    slug: string
    durationMinutes: number
    memberCount: number
    bookingCount: number
    isActive: boolean
  }>
  recentBookings: Array<{
    id: string
    customerName: string
    customerEmail: string
    startTime: string
    status: string
    linkTitle: string
  }>
  calendars: Array<{
    id: string
    accountEmail: string
    calendarId: string
    isActive: boolean
  }>
}

export default function UserDebugView() {
  const [uid, setUid] = useState('')
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDebug = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid.trim()) return

    setLoading(true)
    setError(null)
    setUser(null)

    try {
      const res = await fetch('/api/admin/user-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: uid.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load user')

      setUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Deep User Debug</h2>
        <p className="text-sm text-gray-600 mt-1">View complete user details and history</p>
      </div>

      <form onSubmit={handleDebug} className="flex gap-3">
        <input
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="Email (dolbyjoab@gmail.com) or UID..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-[#0D7377] text-white rounded-xl font-medium hover:bg-[#0a5f63] disabled:opacity-50 transition-colors text-sm"
        >
          {loading ? 'Loading...' : 'Debug'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {user && (
        <div className="space-y-6">
          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Name</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">UID</span>
              <span className="font-mono text-xs">{user.uid}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Timezone</span>
              <span className="font-medium">{user.timezone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Created</span>
              <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Calendars */}
          {user.calendars.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Connected Calendars ({user.calendars.length})</h3>
              <div className="space-y-2">
                {user.calendars.map((cal) => (
                  <div key={cal.id} className="p-3 border border-gray-200 rounded-lg text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{cal.accountEmail}</span>
                      <span className={`text-xs px-2 py-1 rounded ${cal.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {cal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Calendar ID: {cal.calendarId}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {user.links.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Booking Links ({user.links.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {user.links.map((link) => (
                  <div key={link.id} className="p-3 border border-gray-200 rounded-lg text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{link.title}</span>
                      <span className={`text-xs px-2 py-1 rounded ${link.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {link.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">/{link.slug} • {link.durationMinutes}min • {link.memberCount} member{link.memberCount !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-400 mt-1">{link.bookingCount} bookings</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          {user.recentBookings.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Recent Bookings ({user.recentBookings.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {user.recentBookings.slice(0, 10).map((booking) => (
                  <div key={booking.id} className="p-3 border border-gray-200 rounded-lg text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{booking.customerName}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{booking.customerEmail}</p>
                    <p className="text-xs text-gray-400 mt-1">{booking.linkTitle} • {new Date(booking.startTime).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
