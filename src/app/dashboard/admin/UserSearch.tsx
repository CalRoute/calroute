'use client'

import { useState } from 'react'

interface UserResult {
  uid: string
  email: string
  name: string
  timezone: string
  createdAt: string
  bookingCount: number
  linkCount: number
  hasCalendar: boolean
}

export default function UserSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/search-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')

      setResults(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">User Search</h2>
        <p className="text-sm text-gray-600">Search by email or name to view user details</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or name..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D7377] text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-[#0D7377] text-white rounded-xl font-medium hover:bg-[#0a5f63] disabled:opacity-50 transition-colors text-sm"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.map((user) => (
            <div key={user.uid} className="p-4 border border-gray-200 rounded-xl hover:border-[#0D7377] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">UID: {user.uid}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{user.bookingCount}</p>
                  <p className="text-xs text-gray-500">Bookings</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{user.linkCount}</p>
                  <p className="text-xs text-gray-500">Links</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{user.timezone}</p>
                  <p className="text-xs text-gray-500">Timezone</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{user.hasCalendar ? '✅' : '❌'}</p>
                  <p className="text-xs text-gray-500">Calendar</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Created: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No users found matching "{query}"</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Enter an email or name to search</p>
        </div>
      )}
    </div>
  )
}
