'use client'

import { useEffect, useState } from 'react'

interface MemberStatus {
  uid: string
  name: string
  status: 'available' | 'in-meeting' | 'unknown'
}

interface TeamStatusBadgesProps {
  members: Array<{ uid: string; name: string }>
}

export default function TeamStatusBadges({ members }: TeamStatusBadgesProps) {
  const [statuses, setStatuses] = useState<Map<string, MemberStatus>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/api/dashboard/team-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members }),
        })
        const data = await res.json()
        console.log('[team-status] API response:', data)
        const statusMap = new Map<string, MemberStatus>(
          data.statuses?.map((s: MemberStatus) => [s.uid, s]) || []
        )
        console.log('[team-status] status map:', Array.from(statusMap.entries()))
        setStatuses(statusMap)
      } catch (error) {
        console.error('[team-status] fetch failed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatuses()
  }, [members])

  if (loading || statuses.size === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {members.map(member => {
        const status = statuses.get(member.uid)
        if (!status) return null

        const color = {
          available: 'bg-green-100 text-green-700',
          'in-meeting': 'bg-amber-100 text-amber-700',
          unknown: 'bg-gray-100 text-gray-600',
        }[status.status]

        const label = {
          available: 'Available now',
          'in-meeting': 'In meeting',
          unknown: 'Unknown',
        }[status.status]

        return (
          <div
            key={member.uid}
            className={`text-xs font-medium rounded-full px-2.5 py-1 flex items-center gap-1.5 ${color}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${
              status.status === 'available' ? 'bg-green-500' :
              status.status === 'in-meeting' ? 'bg-amber-500' :
              'bg-gray-400'
            }`} />
            {label}
          </div>
        )
      })}
    </div>
  )
}
