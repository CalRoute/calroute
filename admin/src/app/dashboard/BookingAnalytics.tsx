'use client'

interface BookingStats {
  avgDuration: number
  minDuration: number
  maxDuration: number
  totalBookings: number
  popularLinks: Array<{
    linkId: string
    title: string
    bookingCount: number
  }>
  trends: Array<{
    date: string
    bookingCount: number
  }>
  geoDistribution: Array<{
    timezone: string
    bookingCount: number
  }>
}

export default function BookingAnalytics({ stats }: { stats: BookingStats }) {
  // trends already comes in as exactly 7 days with zeros filled in
  const last7Days = stats.trends
  const last7DaysTotal = last7Days.reduce((sum, day) => sum + day.bookingCount, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Booking Analytics</h2>
        <p className="text-sm text-gray-600 mt-1">Deep insights into booking patterns</p>
      </div>

      {/* Duration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-600 uppercase">Avg Duration</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.avgDuration}m</p>
          <p className="text-xs text-gray-500 mt-1">per booking</p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-600 uppercase">Min Duration</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.minDuration}m</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-600 uppercase">Max Duration</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.maxDuration}m</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-600 uppercase">Last 7 Days</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{last7DaysTotal}</p>
          <p className="text-xs text-gray-500 mt-1">bookings</p>
        </div>
      </div>

      {/* Most Popular Links */}
      {stats.popularLinks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Most Popular Links</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.popularLinks.map((link, idx) => (
              <div key={link.linkId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{idx + 1} {link.title}</p>
                  <p className="text-xs text-gray-500">{link.linkId}</p>
                </div>
                <span className="text-lg font-bold text-[#0D7377]">{link.bookingCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Timezone Distribution */}
      {stats.geoDistribution.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Guest Timezones</h3>
          <p className="text-xs text-gray-500 mb-3">Timezones guests were in when they booked</p>
          <div className="space-y-2">
            {stats.geoDistribution.slice(0, 8).map((geo) => (
              <div key={geo.timezone} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{geo.timezone}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#0D7377] h-2 rounded-full"
                      style={{
                        width: `${(geo.bookingCount / Math.max(...stats.geoDistribution.map(g => g.bookingCount))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{geo.bookingCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Trend */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">7-Day Trend</h3>
          <span className="text-xs text-gray-500">{last7DaysTotal} bookings</span>
        </div>
        <div className="flex items-end gap-1.5 h-28">
          {last7Days.map((day) => {
            const maxCount = Math.max(...last7Days.map(d => d.bookingCount), 1)
            const heightPct = Math.max((day.bookingCount / maxCount) * 100, day.bookingCount === 0 ? 0 : 4)
            const label = new Date(day.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' })
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-700 font-medium">{day.bookingCount > 0 ? day.bookingCount : ''}</span>
                <div className="w-full flex items-end" style={{ height: '72px' }}>
                  <div
                    className="w-full bg-[#0D7377] rounded-t transition-all"
                    style={{ height: day.bookingCount === 0 ? '2px' : `${heightPct}%`, opacity: day.bookingCount === 0 ? 0.2 : 1 }}
                    title={`${day.date}: ${day.bookingCount} booking${day.bookingCount !== 1 ? 's' : ''}`}
                  />
                </div>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
