'use client'

import { useState, useEffect } from 'react'

interface FeatureAdoption {
  feature: string
  totalUsage: number
  adoptingUsers: number
  adoptionRate: string
}

export default function FeatureUsageHeatmap() {
  const [features, setFeatures] = useState<FeatureAdoption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeatures()
  }, [])

  const loadFeatures = async () => {
    try {
      const res = await fetch('/api/admin/engagement')
      if (res.ok) {
        const data = await res.json()
        setFeatures(data.featureAdoption || [])
      }
    } catch (err) {
      console.error('Failed to load features:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading feature usage...</div>
  }

  const sorted = features.sort((a, b) => b.totalUsage - a.totalUsage)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Feature Usage & Adoption</h2>
        <p className="text-sm text-gray-600 mt-1">Track feature adoption across users (last 30 days)</p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No feature usage data available</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(feature => {
            const adoptionPercent = parseFloat(feature.adoptionRate)
            const heatColor =
              adoptionPercent >= 3 ? 'bg-green-50 border-green-200' :
              adoptionPercent >= 2 ? 'bg-blue-50 border-blue-200' :
              adoptionPercent >= 1 ? 'bg-yellow-50 border-yellow-200' :
              'bg-gray-50 border-gray-200'

            return (
              <div key={feature.feature} className={`p-4 border rounded-lg ${heatColor}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {feature.feature.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {feature.adoptingUsers} users, {feature.totalUsage} total events
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{feature.adoptionRate}</p>
                    <p className="text-xs text-gray-600">events/user</p>
                  </div>
                </div>

                {/* Simple bar visualization */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      adoptionPercent >= 3 ? 'bg-green-500' :
                      adoptionPercent >= 2 ? 'bg-blue-500' :
                      adoptionPercent >= 1 ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(adoptionPercent * 20, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
