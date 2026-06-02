export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import DashboardLayout from '@/components/DashboardLayout'
import AdminMetrics from './AdminMetrics'
import UserSearch from './UserSearch'
import SystemHealth from './SystemHealth'
import UserDebugView from './UserDebugView'
import BookingAnalytics from './BookingAnalytics'
import ErrorTracking from './ErrorTracking'
import FeedbackTracker from './FeedbackTracker'
import { getBookingDurationStats, getMostPopularLinks, getGeographicDistribution, getBookingTrends } from '@/lib/booking-analytics'
import { getErrorStats } from '@/lib/error-logger'
import { getDeliveryStats } from '@/lib/delivery-tracker'

// Admin UIDs - add your UID here
const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export default async function AdminPage() {
  const user = await requireUser('/dashboard')

  // Check if user is admin
  if (!ADMIN_UIDS.includes(user.uid)) {
    redirect('/dashboard')
  }

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

  // Fetch metrics
  const hostsSnap = await adminDb.collection('hosts').get()
  const totalUsers = hostsSnap.size

  const bookingsSnap = await adminDb.collection('bookings').get()
  const totalBookings = bookingsSnap.size

  const confirmedBookings = bookingsSnap.docs.filter(d => d.data().status === 'confirmed').length
  const cancelledBookings = bookingsSnap.docs.filter(d => d.data().status === 'cancelled').length

  const linksSnap = await adminDb.collection('booking_links').get()
  const totalLinks = linksSnap.size

  // Personal vs team links
  const linksByMemberCount = await Promise.all(
    linksSnap.docs.map(async (linkDoc) => {
      const hostsSnap = await adminDb
        .collection('booking_links')
        .doc(linkDoc.id)
        .collection('hosts')
        .get()
      return hostsSnap.size
    })
  )
  const personalLinks = linksByMemberCount.filter(c => c === 1).length
  const teamLinks = linksByMemberCount.filter(c => c > 1).length

  // Active users (users with at least one booking in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentBookingsSnap = await adminDb
    .collection('bookings')
    .where('startTime', '>=', thirtyDaysAgo.toISOString())
    .get()

  const activeUserIds = new Set(recentBookingsSnap.docs.map(d => d.data().hostId))
  const activeUsers = activeUserIds.size

  // New signups
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.toISOString()

  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(thisWeekStart.getDate() - 7)
  const thisWeekStartStr = thisWeekStart.toISOString()

  const thisMonthStart = new Date(today)
  thisMonthStart.setDate(1)
  const thisMonthStartStr = thisMonthStart.toISOString()

  const newSignupsToday = hostsSnap.docs.filter(d => d.data().createdAt >= todayStart).length
  const newSignupsWeek = hostsSnap.docs.filter(d => d.data().createdAt >= thisWeekStartStr).length
  const newSignupsMonth = hostsSnap.docs.filter(d => d.data().createdAt >= thisMonthStartStr).length

  // Retention rate (users with bookings as % of total)
  const retentionRate = totalUsers > 0 ? ((activeUserIds.size / totalUsers) * 100).toFixed(1) : '0'

  // Phone vs video bookings
  const phoneCallBookings = bookingsSnap.docs.filter(d => {
    return d.data().customerPhone !== null && d.data().customerPhone !== undefined
  }).length

  // Webhook usage
  const webhooksSnap = await adminDb.collectionGroup('webhooks').get()
  const totalWebhooks = webhooksSnap.size
  const usersWithWebhooks = new Set(webhooksSnap.docs.map(d => d.ref.parent.parent?.id)).size

  // API key usage
  const apiKeysSnap = await adminDb.collectionGroup('api_keys').get()
  const totalApiKeys = apiKeysSnap.size
  const usersWithApiKeys = new Set(apiKeysSnap.docs.map(d => d.ref.parent.parent?.id)).size

  // System health - webhook failures (simplified - in production you'd log actual failures)
  const failedWebhooks = 0 // Would be tracked in a separate collection
  const failureRate = totalWebhooks > 0 ? ((failedWebhooks / totalWebhooks) * 100).toFixed(1) : '0.0'

  // System health - API errors (would be logged separately)
  const totalErrors = 0 // Would be from error logs
  const errorRate = totalBookings > 0 ? (( totalErrors / (totalBookings * 0.1)) * 100).toFixed(2) : '0.00'

  const healthMetrics = {
    totalWebhooks,
    failedWebhooks,
    failureRate,
    errorRate: errorRate as string,
    totalErrors,
  }

  // Fetch booking analytics
  const durationStats = await getBookingDurationStats()
  const popularLinks = await getMostPopularLinks(10)
  const geoDistribution = await getGeographicDistribution()
  const bookingTrends = await getBookingTrends(30)

  const bookingAnalytics = {
    avgDuration: durationStats.avgDuration,
    minDuration: durationStats.minDuration,
    maxDuration: durationStats.maxDuration,
    totalBookings: durationStats.totalBookings,
    popularLinks,
    trends: bookingTrends,
    geoDistribution,
  }

  // Fetch error and delivery stats
  const errorStats = await getErrorStats()
  const deliveryStats = await getDeliveryStats(24)

  const errorTracking = {
    totalErrors: errorStats.totalErrors,
    criticalCount: errorStats.criticalCount,
    byType: errorStats.byType,
    bySeverity: errorStats.bySeverity,
    ...deliveryStats,
  }

  const metrics = {
    totalUsers,
    activeUsers,
    retentionRate,
    totalLinks,
    personalLinks,
    teamLinks,
    newSignupsToday,
    newSignupsWeek,
    newSignupsMonth,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    phoneCallBookings,
    videoCallBookings: confirmedBookings - phoneCallBookings,
    cancelRate: confirmedBookings > 0 ? ((cancelledBookings / (confirmedBookings + cancelledBookings)) * 100).toFixed(1) : '0',
    totalWebhooks,
    usersWithWebhooks,
    totalApiKeys,
    usersWithApiKeys,
  }

  return (
    <DashboardLayout
      user={{ email: user.email, name: host?.name }}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin' }]}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and user management</p>
        </div>

        <AdminMetrics metrics={metrics} />

        <SystemHealth metrics={healthMetrics} />

        <ErrorTracking stats={errorTracking} />

        <BookingAnalytics stats={bookingAnalytics} />

        <UserSearch />

        <UserDebugView />

        <FeedbackTracker feedbackStats={{ total: 0, byType: {} }} />
      </div>
    </DashboardLayout>
  )
}
