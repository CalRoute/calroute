'use client'

import { useState, useEffect } from 'react'

interface SlackIntegration {
  userId: string
  slackWorkspaceId: string
  slackTeamName: string
  channelName: string
  notificationsEnabled: boolean
  notifyOn: string[]
  isActive: boolean
}

interface SlackStats {
  totalIntegrations: number
  activeIntegrations: number
  notificationsEnabled: number
}

export default function SlackIntegrationManager() {
  const [integrations, setIntegrations] = useState<SlackIntegration[]>([])
  const [stats, setStats] = useState<SlackStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const res = await fetch('/api/admin/integrations/slack')
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data.integrations || [])
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to load Slack integrations:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading Slack integrations...</div>
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Slack Integration</h2>
        <p className="text-sm text-gray-600 mt-1">Manage Slack workspace integrations</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalIntegrations}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Active</p>
            <p className="text-2xl font-bold text-teal-600">{stats.activeIntegrations}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">With Notifications</p>
            <p className="text-2xl font-bold text-gray-900">{stats.notificationsEnabled}</p>
          </div>
        </div>
      )}

      {integrations.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No Slack integrations yet</p>
      ) : (
        <div className="space-y-3">
          {integrations.map(integration => (
            <div
              key={integration.userId}
              className={`p-4 rounded-lg border ${
                integration.isActive
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{integration.slackTeamName}</p>
                  <p className="text-sm text-gray-600">#{integration.channelName}</p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      integration.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {integration.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {integration.notificationsEnabled && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                      Notifications On
                    </span>
                  )}
                </div>
              </div>

              {integration.notifyOn.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Notifications:</p>
                  <div className="flex flex-wrap gap-2">
                    {integration.notifyOn.map(event => (
                      <span key={event} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {event.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
