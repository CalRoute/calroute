'use client'

import { useState } from 'react'
import AdminMetrics from './AdminMetrics'
import SystemHealth from './SystemHealth'
import ErrorTracking from './ErrorTracking'
import ApiMetricsTracker from './ApiMetricsTracker'
import BookingAnalytics from './BookingAnalytics'
import EngagementMetrics from './EngagementMetrics'
import FeatureUsageHeatmap from './FeatureUsageHeatmap'
import UserSearch from './UserSearch'
import UserDebugView from './UserDebugView'
import UserRolesManager from './UserRolesManager'
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
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'monitoring', label: 'Monitoring', icon: '🔍' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'revenue', label: 'Revenue', icon: '💰' },
  { id: 'communications', label: 'Communications', icon: '📧' },
  { id: 'integrations', label: 'Integrations', icon: '🔗' },
  { id: 'system', label: 'System', icon: '⚙️' },
] as const

export default function AdminDashboardTabs({ metrics, healthMetrics, errorTracking, bookingAnalytics }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#0D7377] text-[#0D7377] bg-[#0D7377]/5'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AdminMetrics metrics={metrics} />
            <OnboardingStats />
            <RevenueAnalytics />
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <SystemHealth metrics={healthMetrics} />
            <ErrorTracking stats={errorTracking} />
            <ApiMetricsTracker />
            <SupportQueue />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <BookingAnalytics stats={bookingAnalytics} />
            <EngagementMetrics />
            <FeatureUsageHeatmap />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <UserRolesManager />
            <AccountManagement />
            <UserSearch />
            <UserDebugView />
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <RevenueAnalytics />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Booking Value</span>
                    <span className="font-semibold text-gray-900">$50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projected Annual</span>
                    <span className="font-semibold text-gray-900">$600K+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Growth Rate</span>
                    <span className="font-semibold text-green-600">+10% MoM</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Goals</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Monthly Target</span>
                      <span className="text-sm font-semibold">75%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-[#0D7377]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Annual Target</span>
                      <span className="text-sm font-semibold">45%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full w-5/12 bg-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Communications Tab */}
        {activeTab === 'communications' && (
          <div className="space-y-6">
            <EmailDeliveryMonitoring />
            <EmailTemplateAnalytics />
            <FeedbackTracker feedbackStats={{ total: 0, byType: {} }} />
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <SlackIntegrationManager />
            <BrandingManager />
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Google Calendar</p>
                    <p className="text-sm text-gray-600">Connected for all users</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Webhooks</p>
                    <p className="text-sm text-gray-600">Real-time event delivery</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Resend Email</p>
                    <p className="text-sm text-gray-600">Email delivery service</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <ApiMetricsTracker />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cache Hit Rate</span>
                    <span className="font-semibold text-green-600">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg Response Time</span>
                    <span className="font-semibold text-gray-900">142ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">DB Query Time</span>
                    <span className="font-semibold text-gray-900">45ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Uptime</span>
                    <span className="font-semibold text-green-600">99.9%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Database Size</span>
                      <span className="text-sm font-semibold">45%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full w-5/12 bg-blue-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">API Rate Limit</span>
                      <span className="text-sm font-semibold">23%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full w-1/4 bg-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
