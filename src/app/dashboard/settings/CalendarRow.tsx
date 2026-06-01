'use client'

import { useState } from 'react'
import * as Switch from '@radix-ui/react-switch'
import * as Dialog from '@radix-ui/react-dialog'
import { useToast } from '@/components/Toast'

interface ConnectedCalendar {
  id: string
  accountEmail: string
  calendarId: string
  label?: string | null
  isActive: boolean
}

interface Props {
  cal: ConnectedCalendar
  onDisconnect?: () => void
}

export default function CalendarRow({ cal, onDisconnect }: Props) {
  const [isActive, setIsActive] = useState(cal.isActive)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { showToast } = useToast()

  const handleToggleActive = async (newState: boolean) => {
    setIsActive(newState)
    setLoading(true)

    try {
      const response = await fetch(`/api/calendars/${cal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newState }),
      })

      if (!response.ok) throw new Error('Failed to update')
      showToast(`Calendar ${newState ? 'activated' : 'deactivated'}`, 'success')
    } catch (error) {
      showToast('Failed to update calendar', 'error')
      setIsActive(!newState)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/calendars/${cal.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to disconnect')
      showToast('Calendar disconnected', 'success')
      setConfirmOpen(false)
      onDisconnect?.()
    } catch (error) {
      showToast('Failed to disconnect calendar', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <p className="text-sm font-medium text-gray-900">{cal.label || cal.accountEmail}</p>
        <p className="text-xs text-gray-500">{cal.accountEmail}</p>
      </div>
      <div className="flex items-center gap-3">
        <Switch.Root
          checked={isActive}
          onCheckedChange={handleToggleActive}
          disabled={loading}
          className="w-11 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-green-500 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Switch.Thumb className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 data-[state=checked]:translate-x-5 transition-transform" />
        </Switch.Root>

        <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Dialog.Trigger asChild>
            <button
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 disabled:opacity-50 transition-colors"
            >
              Disconnect
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 max-w-sm z-50">
              <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                Disconnect calendar?
              </Dialog.Title>
              <p className="text-sm text-gray-600 mb-6">
                You'll no longer be able to use this calendar for bookings. You can reconnect anytime.
              </p>
              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  )
}
