'use client'

import { useState, useEffect } from 'react'

interface BrandingConfig {
  userId: string
  companyName: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  customDomain?: string
}

export default function BrandingManager() {
  const [configs, setConfigs] = useState<BrandingConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const res = await fetch('/api/admin/branding')
      if (res.ok) {
        const data = await res.json()
        setConfigs(data.configs || [])
      }
    } catch (err) {
      console.error('Failed to load branding configs:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading branding configs...</div>
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Custom Branding</h2>
        <p className="text-sm text-gray-600 mt-1">View and manage custom branding for users</p>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        Total custom branding configs: <span className="font-semibold">{configs.length}</span>
      </div>

      {configs.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No custom branding configurations yet</p>
      ) : (
        <div className="space-y-4">
          {configs.map(config => (
            <div key={config.userId} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-medium text-gray-900">{config.companyName}</p>
                  <p className="text-sm text-gray-600">{config.userId}</p>
                </div>
                {config.customDomain && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    {config.customDomain}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Primary Color</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: config.primaryColor }}
                    />
                    <code className="text-xs text-gray-700">{config.primaryColor}</code>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Secondary Color</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: config.secondaryColor }}
                    />
                    <code className="text-xs text-gray-700">{config.secondaryColor}</code>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Accent Color</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: config.accentColor }}
                    />
                    <code className="text-xs text-gray-700">{config.accentColor}</code>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1">Font Family</p>
                  <p className="text-sm font-medium text-gray-700">{config.fontFamily}</p>
                </div>
              </div>

              {config.logoUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Logo</p>
                  <img src={config.logoUrl} alt="Logo" className="h-12 w-auto" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
