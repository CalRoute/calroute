'use client'

const FEATURES = {
  Overview: [
    '✅ Key metrics summary',
    '✅ Onboarding funnel (calendar, links, first booking)',
  ],
  Monitoring: [
    '✅ System health status',
    '✅ Error logs & tracking',
    '✅ API metrics (requires middleware)',
    '✅ Support ticket queue',
    '⚠️ Webhook failures (not yet logged)',
  ],
  Analytics: [
    '✅ Booking duration stats',
    '✅ Booking trends',
    '✅ Most popular links',
    '✅ Geographic distribution',
    '✅ User engagement metrics',
    '⬜ Feature usage heatmap (tracking not wired)',
    '⬜ Reschedule analytics (fields not stored)',
  ],
  Users: [
    '✅ User roles & permissions',
    '✅ Account list (all users)',
    '✅ Disable / re-enable accounts',
    '✅ Delete accounts',
    '✅ User search & debug',
  ],
  Activity: [
    '✅ Booking activity (30d)',
    '✅ Retention rate',
    '⬜ Revenue — no billing system connected',
  ],
  Communications: [
    '✅ Email delivery monitoring',
    '✅ Template delivery rates',
    '⬜ Open/click rates (tracking not implemented)',
    '✅ User feedback tracker',
  ],
  Integrations: [
    '✅ Slack integration manager',
    '✅ Custom branding controls',
    '⬜ Live integration status (not monitored)',
  ],
  System: [
    '✅ API request counts & error rate',
    '✅ Database size estimate',
    '⬜ Cache hit rate (middleware needed)',
    '⬜ Uptime (external monitor needed)',
    '⬜ API rate limit (not exposed by Vercel)',
  ],
}

const LEGEND = [
  { icon: '✅', label: 'Working' },
  { icon: '⚠️', label: 'Partial' },
  { icon: '⬜', label: 'Not implemented' },
]

export default function AdminFeatureChecklist() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Feature Status</h2>
        <div className="flex gap-4 text-xs text-gray-500">
          {LEGEND.map(l => (
            <span key={l.icon}>{l.icon} {l.label}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(FEATURES).map(([category, items]) => (
          <div key={category}>
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">{category}</h3>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-xs text-gray-600">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
