'use client'

import { useEffect, useState } from 'react'

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'availability', label: 'Availability' },
  { id: 'vacation', label: 'Vacation dates' },
  { id: 'languages', label: 'Languages' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'calendars', label: 'Calendars' },
  { id: 'billing', label: 'Billing' },
  { id: 'api-keys', label: 'API keys' },
]

export default function SettingsNav() {
  const [active, setActive] = useState('profile')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )

    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <nav className="space-y-0.5">
      {sections.map(s => (
        <a
          key={s.id}
          href={`#${s.id}`}
          onClick={e => {
            e.preventDefault()
            document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
            active === s.id
              ? 'bg-[#0D7377]/10 text-[#0D7377] font-medium'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          {s.label}
        </a>
      ))}
    </nav>
  )
}
