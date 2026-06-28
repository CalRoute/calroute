'use client'

import { useState } from 'react'
import AdminMetrics from './AdminMetrics'
import SystemHealth from './SystemHealth'
import ErrorTracking from './ErrorTracking'
import BookingAnalytics from './BookingAnalytics'
import EngagementMetrics from './EngagementMetrics'
import UserDebugView from './UserDebugView'
import AccountManagement from './AccountManagement'
import RevenueAnalytics from './RevenueAnalytics'
import FeedbackTracker from './FeedbackTracker'
import SupportQueue from './SupportQueue'
import OnboardingStats from './OnboardingStats'

type TabType = 'overview' | 'monitoring' | 'analytics' | 'users' | 'revenue' | 'communications'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'users', label: 'Users' },
  { id: 'revenue', label: 'Activity' },
  { id: 'communications', label: 'Communications' },
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
            <SystemHealth />
            <ErrorTracking stats={errorTracking} />
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
            <FeedbackTracker />
          </div>
        )}

      </div>
    </div>
  )
}

function IntegrationStatus() {
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
