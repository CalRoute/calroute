'use client'

const FEATURES = {
  Overview: [
    '✓ Key metrics summary',
    '✓ Onboarding progress',
    '✓ Revenue overview',
  ],
  Monitoring: [
    '✓ System health status',
    '✓ Error logs & tracking',
    '✓ API metrics & latency',
    '✓ Support queue',
    '✓ Webhook status',
  ],
  Analytics: [
    '✓ Booking duration stats',
    '✓ Booking trends (7-day)',
    '✓ Most popular links',
    '✓ Geographic distribution',
    '✓ User engagement metrics',
    '✓ Feature usage heatmap',
    '✓ Calendar sync status',
    '✓ Booking reschedule analytics',
  ],
  Users: [
    '✓ User roles & permissions',
    '✓ Account management',
    '✓ Disable/delete users',
    '✓ User search & debug',
  ],
  Revenue: [
    '✓ MRR & ARR metrics',
    '✓ Revenue projections',
    '✓ Bookings per user',
    '✓ Revenue goals tracking',
  ],
  Communications: [
    '✓ Email delivery status',
    '✓ Email template performance',
    '✓ Open & click rates',
    '✓ User feedback tracker',
  ],
  Integrations: [
    '✓ Slack integration manager',
    '✓ Custom branding controls',
    '✓ Integration status',
    '✓ Webhook configuration',
  ],
  System: [
    '✓ API metrics & latency',
    '✓ Cache hit rates',
    '✓ Database performance',
    '✓ Capacity monitoring',
    '✓ Uptime tracking',
  ],
}

export default function AdminFeatureChecklist() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-blue-900 mb-4">Admin Dashboard Complete Feature List</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(FEATURES).map(([category, items]) => (
          <div key={category}>
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">{category}</h3>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-xs text-blue-800">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-sm text-blue-800 mt-4">
        All features organized in tabs above. Switch tabs to see specific dashboards.
      </p>
    </div>
  )
}
