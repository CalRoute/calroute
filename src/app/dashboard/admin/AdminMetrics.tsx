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

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{label}</p>
      <p className={`text-3xl font-bold mb-1 ${accent ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function AdminMetrics({ metrics }: { metrics: Metrics }) {
  const phonePct = metrics.confirmedBookings > 0
    ? ((metrics.phoneCallBookings / metrics.confirmedBookings) * 100).toFixed(0)
    : '0'
  const videoPct = metrics.confirmedBookings > 0
    ? ((metrics.videoCallBookings / metrics.confirmedBookings) * 100).toFixed(0)
    : '0'

  return (
    <div className="space-y-4">
      {/* Users row */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Users</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total users" value={metrics.totalUsers} sub={`+${metrics.newSignupsMonth} this month`} />
          <StatCard label="Active (30 d)" value={metrics.activeUsers} sub={`${metrics.retentionRate}% retention`} accent="text-[#0D7377]" />
          <StatCard label="New today" value={metrics.newSignupsToday} />
          <StatCard label="New this week" value={metrics.newSignupsWeek} />
        </div>
      </div>

      {/* Bookings row */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bookings</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total bookings" value={metrics.totalBookings} />
          <StatCard label="Confirmed" value={metrics.confirmedBookings} accent="text-teal-600" />
          <StatCard label="Cancelled" value={metrics.cancelledBookings} sub={`${metrics.cancelRate}% cancel rate`} accent={Number(metrics.cancelRate) > 20 ? 'text-red-500' : 'text-gray-900'} />
          <StatCard label="Phone vs video" value={`${phonePct}% / ${videoPct}%`} sub={`${metrics.phoneCallBookings} phone · ${metrics.videoCallBookings} video`} />
        </div>
      </div>

      {/* Links & integrations row */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Links & integrations</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Booking links" value={metrics.totalLinks} sub={`${metrics.personalLinks} personal · ${metrics.teamLinks} team`} />
          <StatCard label="Webhooks" value={metrics.totalWebhooks} sub={`${metrics.usersWithWebhooks} users`} />
          <StatCard label="API keys" value={metrics.totalApiKeys} sub={`${metrics.usersWithApiKeys} users`} />
        </div>
      </div>
    </div>
  )
}
