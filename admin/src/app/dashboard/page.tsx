export const dynamic = 'force-dynamic'

import { requireAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'
import AdminDashboardTabs from './AdminDashboardTabs'
import { getBookingDurationStats, getMostPopularLinks, getGeographicDistribution, getBookingTrends } from '@/lib/booking-analytics'
import { getErrorStats } from '@/lib/error-logger'
import { getDeliveryStats } from '@/lib/delivery-tracker'

export default async function AdminDashboardPage() {
  await requireAdminSession()

  const hostsSnap = await adminDb.collection('hosts').get()
  const totalUsers = hostsSnap.size

  const bookingsSnap = await adminDb.collection('bookings').get()
  const totalBookings = bookingsSnap.size

  const confirmedBookings = bookingsSnap.docs.filter(d => d.data().status === 'confirmed').length
  const cancelledBookings = bookingsSnap.docs.filter(d => d.data().status === 'cancelled').length

  const linksSnap = await adminDb.collection('booking_links').get()
  const totalLinks = linksSnap.size

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

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const recentBookings = bookingsSnap.docs.filter(d => {
    const booking = d.data()
    return booking.startTime >= thirtyDaysAgoStr && booking.status === 'confirmed'
  })

  const activeUserIds = new Set(recentBookings.map(d => d.data().hostId))
  const activeUsers = activeUserIds.size

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

  const retentionRate = totalUsers > 0 ? ((activeUserIds.size / totalUsers) * 100).toFixed(1) : '0'

  const phoneCallBookings = bookingsSnap.docs.filter(d => {
    return d.data().customerPhone !== null && d.data().customerPhone !== undefined
  }).length

  const webhooksSnap = await adminDb.collectionGroup('webhooks').get()
  const totalWebhooks = webhooksSnap.size
  const usersWithWebhooks = new Set(webhooksSnap.docs.map(d => d.ref.parent.parent?.id)).size

  const apiKeysSnap = await adminDb.collectionGroup('api_keys').get()
  const totalApiKeys = apiKeysSnap.size
  const usersWithApiKeys = new Set(apiKeysSnap.docs.map(d => d.ref.parent.parent?.id)).size

  const failedWebhooks = 0
  const failureRate = totalWebhooks > 0 ? ((failedWebhooks / totalWebhooks) * 100).toFixed(1) : '0.0'
  const totalErrors = 0
  const errorRate = totalBookings > 0 ? ((totalErrors / (totalBookings * 0.1)) * 100).toFixed(2) : '0.00'

  const healthMetrics = {
    totalWebhooks,
    failedWebhooks,
    failureRate,
    errorRate: errorRate as string,
    totalErrors,
  }

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">System overview and user management</p>
      </div>

      <AdminDashboardTabs
        metrics={metrics}
        healthMetrics={healthMetrics}
        errorTracking={errorTracking}
        bookingAnalytics={bookingAnalytics}
      />
    </div>
  )
}
