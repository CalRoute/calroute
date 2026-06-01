'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

interface BookingLink {
  id: string
  title: string
  slug: string
  durationMinutes: number
  isActive: boolean
}

interface Props {
  links: BookingLink[]
}

export default function BookingLinksSection({ links: initialLinks }: Props) {
  const { showToast } = useToast()
  const [links, setLinks] = useState(initialLinks)
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this booking link? This action cannot be undone.')) return

    setLoading(id)
    try {
      const res = await fetch(`/api/booking-links/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to delete link', 'error')
        return
      }
      setLinks(links.filter(l => l.id !== id))
      showToast('Link deleted', 'success')
    } catch (error) {
      showToast('Error deleting link', 'error')
    } finally {
      setLoading(null)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setLoading(id)
    try {
      const res = await fetch(`/api/booking-links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to update link', 'error')
        return
      }
      setLinks(links.map(l => l.id === id ? { ...l, isActive: !isActive } : l))
      showToast(`Link ${!isActive ? 'activated' : 'deactivated'}`, 'success')
    } catch (error) {
      showToast('Error updating link', 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Booking links</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Create and manage your booking links.
          </p>
        </div>
        <Link
          href="/dashboard/links/new"
          className="inline-flex items-center justify-center gap-1.5 bg-[#0D7377] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#0a5f63] transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          + Create link
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">No booking links yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Create your first link to start accepting bookings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map(link => (
            <div key={link.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{link.title}</p>
                <p className="text-xs text-gray-500 mt-1">/book/{link.slug}</p>
                <p className="text-xs text-gray-400 mt-0.5">{link.durationMinutes} min</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleActive(link.id, link.isActive)}
                  disabled={loading === link.id}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    link.isActive
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {link.isActive ? 'Active' : 'Inactive'}
                </button>
                <Link
                  href={`/dashboard/links/${link.id}`}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(link.id)}
                  disabled={loading === link.id}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
