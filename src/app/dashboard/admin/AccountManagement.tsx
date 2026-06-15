'use client'

import { useState, useEffect } from 'react'

interface Account {
  uid: string
  email: string
  name: string
  status: 'active' | 'disabled'
}

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [disableReason, setDisableReason] = useState<string>('')

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/admin/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.statuses || [])
      }
    } catch (err) {
      console.error('Failed to load accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const performAction = async (uid: string, action: 'disable' | 'enable' | 'delete') => {
    setActioningId(uid)
    try {
      const res = await fetch(`/api/admin/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: disableReason }),
      })

      if (res.ok) {
        await loadAccounts()
        setDisableReason('')
      }
    } catch (err) {
      console.error('Failed to perform action:', err)
    } finally {
      setActioningId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading accounts...</div>
  }

  const activeAccounts = accounts.filter(a => a.status === 'active')
  const disabledAccounts = accounts.filter(a => a.status === 'disabled')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Account Management</h2>
        <p className="text-sm text-gray-600 mt-1">Manage user accounts and access</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Active Accounts</p>
          <p className="text-3xl font-bold text-teal-600">{activeAccounts.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Disabled Accounts</p>
          <p className="text-3xl font-bold text-gray-900">{disabledAccounts.length}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Active Accounts</h3>
        {activeAccounts.length === 0 ? (
          <p className="text-sm text-gray-500">No active accounts</p>
        ) : (
          activeAccounts.map(account => (
            <div key={account.uid} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{account.name}</p>
                  <p className="text-sm text-gray-600 truncate">{account.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => performAction(account.uid, 'disable')}
                    disabled={actioningId === account.uid}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Disable
                  </button>
                  <button
                    onClick={() => performAction(account.uid, 'delete')}
                    disabled={actioningId === account.uid}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Disabled Accounts</h3>
        {disabledAccounts.length === 0 ? (
          <p className="text-sm text-gray-500">No disabled accounts</p>
        ) : (
          disabledAccounts.map(account => (
            <div key={account.uid} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{account.name}</p>
                  <p className="text-sm text-gray-600 truncate">{account.email}</p>
                </div>
                <button
                  onClick={() => performAction(account.uid, 'enable')}
                  disabled={actioningId === account.uid}
                  className="flex-shrink-0 px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200 disabled:opacity-50"
                >
                  Re-enable
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
