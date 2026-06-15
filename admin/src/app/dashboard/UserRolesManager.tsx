'use client'

import { useState, useEffect } from 'react'

interface User {
  uid: string
  email: string
  name: string
  role: 'admin' | 'moderator' | 'user'
  createdAt: string
}

const ROLES = [
  { value: 'admin' as const, label: 'Admin', color: 'bg-red-100 text-red-700', description: 'Full system access' },
  { value: 'moderator' as const, label: 'Moderator', color: 'bg-blue-100 text-blue-700', description: 'Analytics & support' },
  { value: 'user' as const, label: 'User', color: 'bg-gray-100 text-gray-700', description: 'View analytics only' },
]

export default function UserRolesManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (uid: string, newRole: string) => {
    setUpdating(uid)
    try {
      const res = await fetch(`/api/admin/users/${uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole as any } : u))
      }
    } catch (err) {
      console.error('Failed to update role:', err)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading users...</div>
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">User Roles & Permissions</h2>
        <p className="text-sm text-gray-600 mt-1">Manage user access levels and permissions</p>
      </div>

      <div className="space-y-2">
        {users.map(user => {
          const currentRole = ROLES.find(r => r.value === user.role)
          return (
            <div key={user.uid} className="p-4 border border-gray-200 rounded-lg flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <select
                value={user.role}
                onChange={(e) => updateRole(user.uid, e.target.value)}
                disabled={updating === user.uid}
                className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0D7377] ${
                  currentRole?.color || ''
                } disabled:opacity-50`}
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ROLES.map(role => (
            <div key={role.value} className="p-3 bg-gray-50 rounded-lg">
              <p className={`text-sm font-medium px-2 py-1 rounded-md inline-block ${role.color}`}>
                {role.label}
              </p>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {role.value === 'admin' && 'Full system access, manage users, all analytics & webhooks'}
                {role.value === 'moderator' && 'View analytics, manage support tickets, view webhooks'}
                {role.value === 'user' && 'View own analytics only'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
