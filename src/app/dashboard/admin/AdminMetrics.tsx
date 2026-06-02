'use client'

interface Metrics {
  totalUsers: number
  activeUsers: number
  retentionRate: string | number
  totalLinks: number
  personalLinks: number
  teamLinks: number
  newSignupsToday: number
  newSignupsWeek: number
  newSignupsMonth: number
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  phoneCallBookings: number
  videoCallBookings: number
  cancelRate: string | number
  totalWebhooks: number
  usersWithWebhooks: number
  totalApiKeys: number
  usersWithApiKeys: number
}

export default function AdminMetrics({ metrics }: { metrics: Metrics }) {
  const statCards = [
    {
      label: 'Total Users',
      value: metrics.totalUsers,
      subtitle: `+${metrics.newSignupsToday} today, +${metrics.newSignupsWeek} this week`,
      color: 'bg-blue-50',
      icon: '👥',
    },
    {
      label: 'Active Users (30d)',
      value: metrics.activeUsers,
      percentage: `${metrics.retentionRate}% retention`,
      color: 'bg-green-50',
      icon: '✨',
    },
    {
      label: 'Booking Links',
      value: metrics.totalLinks,
      subtitle: `${metrics.personalLinks} personal, ${metrics.teamLinks} team`,
      color: 'bg-purple-50',
      icon: '🔗',
    },
    {
      label: 'Total Bookings',
      value: metrics.totalBookings,
      subtitle: `${metrics.confirmedBookings} confirmed`,
      color: 'bg-orange-50',
      icon: '📅',
    },
    {
      label: 'Cancellation Rate',
      value: `${metrics.cancelRate}%`,
      subtitle: `${metrics.cancelledBookings} of ${metrics.confirmedBookings + metrics.cancelledBookings}`,
      color: 'bg-red-50',
      icon: '⚠️',
    },
    {
      label: 'Phone Call Bookings',
      value: metrics.phoneCallBookings,
      percentage: metrics.confirmedBookings > 0 ? ((metrics.phoneCallBookings / metrics.confirmedBookings) * 100).toFixed(0) : '0',
      color: 'bg-indigo-50',
      icon: '📞',
    },
    {
      label: 'Video Bookings',
      value: metrics.videoCallBookings,
      percentage: metrics.confirmedBookings > 0 ? ((metrics.videoCallBookings / metrics.confirmedBookings) * 100).toFixed(0) : '0',
      color: 'bg-cyan-50',
      icon: '📹',
    },
    {
      label: 'Webhooks Created',
      value: metrics.totalWebhooks,
      subtitle: `${metrics.usersWithWebhooks} users adopted`,
      color: 'bg-yellow-50',
      icon: '🪝',
    },
    {
      label: 'API Keys Generated',
      value: metrics.totalApiKeys,
      subtitle: `${metrics.usersWithApiKeys} users generated`,
      color: 'bg-pink-50',
      icon: '🔑',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((card) => (
        <div key={card.label} className={`${card.color} rounded-2xl border border-gray-200 p-5 sm:p-6`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
          {card.percentage && (
            <p className="text-xs text-gray-600">{card.percentage}% of total</p>
          )}
          {card.subtitle && (
            <p className="text-xs text-gray-600">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  )
}
