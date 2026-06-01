'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { format, parseISO } from 'date-fns'

interface ApiKey {
  id: string
  name: string
  createdAt: string
}

interface Props {
  apiKeys: ApiKey[]
}

export default function ApiKeysSection({ apiKeys: initialKeys }: Props) {
  const { showToast } = useToast()
  const [keys, setKeys] = useState(initialKeys)
  const [loading, setLoading] = useState(false)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) {
      showToast('Key name is required', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/hosts/me/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to generate key', 'error')
        return
      }

      const data = await res.json()
      setGeneratedKey(data.plaintext)
      setKeys([...keys, { id: data.id, name: newKeyName, createdAt: new Date().toISOString() }])
      setNewKeyName('')
    } catch (error) {
      showToast('Error generating key', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Revoke this API key? Applications using it will no longer work.')) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/hosts/me/api-keys/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to delete key', 'error')
        return
      }
      setKeys(keys.filter(k => k.id !== id))
      showToast('Key revoked', 'success')
    } catch (error) {
      showToast('Error revoking key', 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">API Keys</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Create keys to access CalRoute APIs programmatically.
          </p>
        </div>
        {keys.length < 5 && (
          <button
            onClick={() => setShowNewKeyDialog(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-[#0D7377] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#0a5f63] transition-colors whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
            disabled={loading}
          >
            + Create key
          </button>
        )}
      </div>

      {keys.length === 0 && !showNewKeyDialog ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">No API keys yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Create a key to integrate with CalRoute APIs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(key => (
            <div key={key.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{key.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Created {format(parseISO(key.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={() => handleDeleteKey(key.id)}
                disabled={deleting === key.id}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Key Dialog */}
      {showNewKeyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {generatedKey ? 'Copy your API key' : 'Create new API key'}
            </h3>

            {generatedKey ? (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">Your new API key (shown only once):</p>
                  <code className="text-xs font-mono text-gray-900 break-all">{generatedKey}</code>
                </div>
                <p className="text-xs text-gray-600">
                  Save this key in a secure place. You won&apos;t be able to see it again.
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey)
                    showToast('Copied to clipboard', 'success')
                    setGeneratedKey(null)
                    setShowNewKeyDialog(false)
                  }}
                  className="w-full bg-[#0D7377] text-white font-medium py-2.5 rounded-lg hover:bg-[#0a5f63] transition-colors"
                >
                  Copy and close
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Key name</label>
                  <input
                    type="text"
                    placeholder="e.g., My App"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewKeyDialog(false)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-[#0D7377] hover:bg-[#0a5f63] rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
