'use client'

import { format, parseISO } from 'date-fns'
import { useToast } from '@/components/Toast'

interface Booking {
  id: string
  customerName: string
  customerEmail: string
  startTime: string
  bookingLinkId: string
  status: string
  durationMinutes?: number
}

interface Props {
  bookings: Booking[]
}

export default function AnalyticsExportButton({ bookings }: Props) {
  const { showToast } = useToast()

  const handleExport = () => {
    const headers = ['Date', 'Name', 'Email', 'Link ID', 'Duration (min)', 'Status']
    const rows = bookings.map(b => [
      format(parseISO(b.startTime), 'MMM d, yyyy'),
      b.customerName,
      b.customerEmail,
      b.bookingLinkId,
      b.durationMinutes || '30',
      b.status,
    ])

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Analytics exported', 'success')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <button
        onClick={handleExport}
        className="w-full bg-[#0D7377] text-white font-medium py-2.5 rounded-xl hover:bg-[#0a5f63] transition-colors"
      >
        ↓ Export analytics to CSV
      </button>
    </div>
  )
}
