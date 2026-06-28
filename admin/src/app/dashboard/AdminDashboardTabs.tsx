'use client'

import { useState, useEffect } from 'react'
import AdminMetrics from './AdminMetrics'
import SystemHealth from './SystemHealth'
import ErrorTracking from './ErrorTracking'
import ApiMetricsTracker from './ApiMetricsTracker'
import BookingAnalytics from './BookingAnalytics'
import EngagementMetrics from './EngagementMetrics'
import UserDebugView from './UserDebugView'
import AccountManagement from './AccountManagement'
import RevenueAnalytics from './RevenueAnalytics'
import EmailDeliveryMonitoring from './EmailDeliveryMonitoring'
import EmailTemplateAnalytics from './EmailTemplateAnalytics'
import FeedbackTracker from './FeedbackTracker'
import SlackIntegrationManager from './SlackIntegrationManager'
import BrandingManager from './BrandingManager'
import SupportQueue from './SupportQueue'
import OnboardingStats from './OnboardingStats'

type TabType = 'overview' | 'monitoring' | 'analytics' | 'users' | 'revenue' | 'communications' | 'integrations' | 'system'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'users', label: 'Users' },
  { id: 'revenue', label: 'Activity' },
  { id: 'communications', label: 'Communications' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'system', label: 'System' },
] as const

export default function AdminDashboardTabs({ metrics, healthMetrics, errorTracking, bookingAnalytics }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#0D7377] text-[#0D7377]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AdminMetrics metrics={metrics} />
            <OnboardingStats />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <SystemHealth metrics={healthMetrics} />
            <ErrorTracking stats={errorTracking} />
            <ApiMetricsTracker />
            <SupportQueue />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <BookingAnalytics stats={bookingAnalytics} />
            <EngagementMetrics />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <AccountManagement />
            <UserDebugView />
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <RevenueAnalytics />
          </div>
        )}

        {activeTab === 'communications' && (
          <div className="space-y-6">
            <EmailDeliveryMonitoring />
            <EmailTemplateAnalytics />
            <FeedbackTracker />
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <SlackIntegrationManager />
            <BrandingManager />
            <IntegrationStatus />
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <ApiMetricsTracker />
            <SystemPerformanceMetrics />
          </div>
        )}
      </div>
    </div>
  )
}

function IntegrationStatus() {
  const [counts, setCounts] = useState<{ webhooks: number; calendars: number } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/system-health-stats').then(r => r.ok ? r.json() : null),
    ]).then(([health]) => {
      if (health) {
        setCounts({
          webhooks: health.api?.totalRequests ?? 0,
          calendars: 0,
        })
      }
    }).catch(() => {})
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Google Calendar</p>
            <p className="text-sm text-gray-600">OAuth per-user connection</p>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">Per-user</span>
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Webhooks</p>
            <p className="text-sm text-gray-600">Real-time event delivery</p>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">User-configured</span>
        </div>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Resend Email</p>
            <p className="text-sm text-gray-600">Transactional email service</p>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">System-wide</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4">Live status checks are not implemented — check service dashboards directly.</p>
    </div>
  )
}

function SystemPerformanceMetrics() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/system-health-stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-8 text-gray-500">Loading performance metrics...</div>
  if (!stats) return null

  const hasApiData = stats.api?.totalRequests > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Metrics (24h)</h3>
        {hasApiData ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Requests</span>
              <span className="font-semibold text-gray-900">{stats.api.totalRequests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Error Rate</span>
              <span className={`font-semibold ${parseFloat(stats.api.errorRate) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.api.errorRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="font-semibold text-gray-900">
                {stats.performance?.avgResponseTime != null ? `${stats.performance.avgResponseTime}ms` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cache Hit Rate</span>
              <span className="font-semibold text-gray-900">
                {stats.performance?.cacheHitRate != null ? `${stats.performance.cacheHitRate}%` : '—'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No API metrics yet. Wire <code>trackApiRequest()</code> into middleware to enable.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Database Size (est.)</span>
              <span className="text-sm font-semibold">{stats.capacity?.databaseSize ?? 0}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${Math.min(stats.capacity?.databaseSize ?? 0, 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">API Rate Limit</span>
              <span className="text-sm font-medium text-gray-400">Not monitored</span>
            </div>
            <p className="text-xs text-gray-400">Vercel does not expose rate limit consumption via API.</p>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-gray-400">Not monitored</span>
            </div>
            <p className="text-xs text-gray-400">Connect an uptime service (e.g. BetterStack) to track this.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
