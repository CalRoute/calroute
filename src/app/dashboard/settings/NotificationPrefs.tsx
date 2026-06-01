'use client'

import { useState } from 'react'
import * as Switch from '@radix-ui/react-switch'
import { useToast } from '@/components/Toast'

interface NotificationPrefs {
  emailOnNewBooking: boolean
  emailOnCancellation: boolean
  emailOnReschedule: boolean
}

interface Props {
  savedPrefs: NotificationPrefs
}

export default function NotificationPrefs({ savedPrefs }: Props) {
  const [prefs, setPrefs] = useState(savedPrefs)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleToggle = async (key: keyof NotificationPrefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] }
    setPrefs(newPrefs)

    setLoading(true)
    try {
      const response = await fetch('/api/hosts/me/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      })

      if (!response.ok) throw new Error('Failed to save')
      showToast('Notification preferences updated', 'success')
    } catch (error) {
      showToast('Failed to update preferences', 'error')
      setPrefs(savedPrefs)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-3">
        <div>
          <label className="text-sm font-medium text-gray-900">Email on new booking</label>
          <p className="text-xs text-gray-500">Get notified when a new booking is created</p>
        </div>
        <Switch.Root
          checked={prefs.emailOnNewBooking}
          onCheckedChange={() => handleToggle('emailOnNewBooking')}
          disabled={loading}
          className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-[#0D7377] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Switch.Thumb className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 data-[state=checked]:translate-x-5 transition-transform" />
        </Switch.Root>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-gray-200">
        <div>
          <label className="text-sm font-medium text-gray-900">Email on cancellation</label>
          <p className="text-xs text-gray-500">Get notified when a booking is cancelled</p>
        </div>
        <Switch.Root
          checked={prefs.emailOnCancellation}
          onCheckedChange={() => handleToggle('emailOnCancellation')}
          disabled={loading}
          className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-[#0D7377] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Switch.Thumb className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 data-[state=checked]:translate-x-5 transition-transform" />
        </Switch.Root>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-gray-200">
        <div>
          <label className="text-sm font-medium text-gray-900">Email on reschedule</label>
          <p className="text-xs text-gray-500">Get notified when a booking is rescheduled</p>
        </div>
        <Switch.Root
          checked={prefs.emailOnReschedule}
          onCheckedChange={() => handleToggle('emailOnReschedule')}
          disabled={loading}
          className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-[#0D7377] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Switch.Thumb className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 data-[state=checked]:translate-x-5 transition-transform" />
        </Switch.Root>
      </div>
    </div>
  )
}
