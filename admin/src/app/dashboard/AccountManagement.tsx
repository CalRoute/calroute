'use client'

import { useState, useEffect } from 'react'

interface Account {
  uid: string
  email: string
  name: string
  createdAt: string
  status: 'active' | 'disabled' | 'deleted'
  disabledReason?: string
  isVip?: boolean
}

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [disableReason, setDisableReason] = useState('')
  const [pendingDisable, setPendingDisable] = useState<string | null>(null)
  const [vipLoading, setVipLoading] = useState<string | null>(null)

  useEffect(() => { loadAccounts() }, [])

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/admin/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch (err) {
      console.error('Failed to load accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  const performAction = async (uid: string, action: 'disable' | 'enable' | 'delete', reason?: string) => {
    setActioningId(uid)
    try {
      const res = await fetch(`/api/admin/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      if (res.ok) {
        await loadAccounts()
        setDisableReason('')
        setPendingDisable(null)
      }
    } catch (err) {
      console.error('Failed to perform action:', err)
    } finally {
      setActioningId(null)
    }
  }

  const toggleVip = async (uid: string, currentlyVip: boolean) => {
    setVipLoading(uid)
    try {
      await fetch('/api/admin/accounts/vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, grant: !currentlyVip }),
      })
      setAccounts(prev => prev.map(a => a.uid === uid ? { ...a, isVip: !currentlyVip } : a))
    } catch (err) {
      console.error('Failed to toggle VIP:', err)
    } finally {
      setVipLoading(null)
    }
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Loading accounts...</div>

  const active = accounts.filter(a => a.status === 'active')
  const disabled = accounts.filter(a => a.status === 'disabled')

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Account Management</h2>
        <p className="text-sm text-gray-600 mt-1">All {accounts.length} user accounts</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Active</p>
          <p className="text-3xl font-bold text-teal-600">{active.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Disabled</p>
          <p className="text-3xl font-bold text-gray-900">{disabled.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">VIP</p>
          <p className="text-3xl font-bold text-amber-500">{accounts.filter(a => a.isVip).length}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Active Accounts</h3>
        {active.length === 0 ? (
          <p className="text-sm text-gray-500">No active accounts</p>
        ) : (
          active.map(account => (
            <div key={account.uid} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{account.name || '(no name)'}</p>
                    {account.isVip && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">VIP</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{account.email}</p>
                  {account.createdAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Joined {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleVip(account.uid, !!account.isVip)}
                    disabled={vipLoading === account.uid}
                    className={`px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 ${
                      account.isVip
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    {account.isVip ? 'Revoke VIP' : 'Grant VIP'}
                  </button>
                  {pendingDisable === account.uid ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reason (required)"
                        value={disableReason}
                        onChange={e => setDisableReason(e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded w-36"
                      />
                      <button
                        onClick={() => performAction(account.uid, 'disable', disableReason)}
                        disabled={!disableReason.trim() || actioningId === account.uid}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setPendingDisable(null)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setPendingDisable(account.uid)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Disable
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${account.email}? This cannot be undone.`)) {
                            performAction(account.uid, 'delete')
                          }
                        }}
                        disabled={actioningId === account.uid}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {disabled.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Disabled Accounts</h3>
          {disabled.map(account => (
            <div key={account.uid} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{account.name || '(no name)'}</p>
                  <p className="text-sm text-gray-600 truncate">{account.email}</p>
                  {account.disabledReason && (
                    <p className="text-xs text-red-600 mt-0.5">Reason: {account.disabledReason}</p>
                  )}
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
          ))}
        </div>
      )}
    </div>
  )
}
