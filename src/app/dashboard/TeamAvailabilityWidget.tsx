'use client'

import { useState, useEffect } from 'react'

interface TeamMember {
  uid: string
  name: string
}

interface MemberStatus {
  uid: string
  name: string
  status: 'available' | 'in-meeting' | 'unknown'
}

interface Props {
  teamMembers: TeamMember[]
}

export default function TeamAvailabilityWidget({ teamMembers }: Props) {
  const [statuses, setStatuses] = useState<MemberStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/dashboard/team-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: teamMembers }),
        })
        const data = await response.json()
        setStatuses(data.statuses || [])
      } catch (error) {
        console.error('Failed to fetch team availability:', error)
        setStatuses(teamMembers.map(m => ({ uid: m.uid, name: m.name, status: 'unknown' })))
      } finally {
        setLoading(false)
      }
    }

    fetchStatuses()
  }, [teamMembers])

  if (loading || statuses.length === 0) return null

  const statusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500'
      case 'in-meeting':
        return 'bg-amber-500'
      default:
        return 'bg-gray-400'
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available'
      case 'in-meeting':
        return 'In a meeting'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <h3 className="font-semibold text-gray-900">Team availability</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {statuses.map(member => (
          <div key={member.uid} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColor(member.status)}`} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{member.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{statusLabel(member.status)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
