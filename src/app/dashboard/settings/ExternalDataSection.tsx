'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface ExternalDataConfig {
  configured: boolean
  apiEndpoint?: string
  updatedAt?: string
}

interface Props {
  initialConfig: ExternalDataConfig
}

export default function ExternalDataSection({ initialConfig }: Props) {
  const { showToast } = useToast()
  const [config, setConfig] = useState(initialConfig)
  const [apiEndpoint, setApiEndpoint] = useState(config.apiEndpoint || '')
  const [apiKey, setApiKey] = useState('')
  const [showForm, setShowForm] = useState(!config.configured)
  const [loading, setLoading] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiEndpoint.trim() || !apiKey.trim()) {
      showToast('API endpoint and key are required', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/hosts/me/external-data-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiEndpoint, apiKey }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to save config', 'error')
        return
      }

      setConfig({ configured: true, apiEndpoint, updatedAt: new Date().toISOString() })
      setApiKey('')
      setShowForm(false)
      setShowKeyInput(false)
      showToast('External data API configured successfully', 'success')
    } catch (error) {
      showToast('Error saving configuration', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Remove external data configuration? Booking links will no longer fetch external data.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/hosts/me/external-data-config', { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to delete config', 'error')
        return
      }

      setConfig({ configured: false })
      setApiEndpoint('')
      setApiKey('')
      setShowForm(false)
      setShowKeyInput(false)
      showToast('Configuration removed', 'success')
    } catch (error) {
      showToast('Error deleting configuration', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">External User Data Integration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically fetch user data from your systems when they book
          </p>
        </div>
      </div>

      {config.configured && !showForm && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-green-600 text-xl">✓</div>
            <div className="flex-1">
              <p className="font-medium text-green-900">Configured</p>
              <p className="text-sm text-green-700 mt-1">
                API Endpoint: <code className="bg-white px-2 py-1 rounded text-xs">{config.apiEndpoint}</code>
              </p>
              {config.updatedAt && (
                <p className="text-xs text-green-600 mt-2">
                  Updated {new Date(config.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSave} className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              API Endpoint
            </label>
            <input
              type="url"
              value={apiEndpoint}
              onChange={e => setApiEndpoint(e.target.value)}
              placeholder="https://api.example.com/users/lookup"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              The endpoint that returns user data based on query parameters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              API Secret Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377]"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Sent as Authorization: Bearer [key]
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#0D7377] text-white rounded-lg hover:bg-[#0a5f63] disabled:opacity-50 font-medium text-sm"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
            {config.configured && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="flex gap-3">
          {config.configured ? (
            <>
              <button
                onClick={() => setShowForm(true)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Update Configuration
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium text-sm disabled:opacity-50"
              >
                Remove
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full px-4 py-2 bg-[#0D7377] text-white rounded-lg hover:bg-[#0a5f63] font-medium text-sm"
            >
              Configure External API
            </button>
          )}
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>How it works:</strong> When a user books with query parameters like <code className="bg-white px-1.5 py-0.5 rounded text-xs">?email=user@example.com&pdCode=ABC123</code>, CalRoute will fetch their data from your API and pre-fill the booking form.
        </p>
      </div>
    </div>
  )
}
