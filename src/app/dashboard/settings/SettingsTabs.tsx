'use client'

import { useState } from 'react'

type Tab = 'profile' | 'availability' | 'integrations' | 'billing'

export default function SettingsTabs({ children }: {
  children: {
    profile: React.ReactNode
    availability: React.ReactNode
    integrations: React.ReactNode
    billing: React.ReactNode
  }
}) {
  const [tab, setTab] = useState<Tab>('profile')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'availability', label: 'Availability' },
    { id: 'integrations', label: 'Calendars' },
    { id: 'billing', label: 'Billing & API' },
  ]

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {tab === 'profile' && children.profile}
        {tab === 'availability' && children.availability}
        {tab === 'integrations' && children.integrations}
        {tab === 'billing' && children.billing}
      </div>
    </>
  )
}
