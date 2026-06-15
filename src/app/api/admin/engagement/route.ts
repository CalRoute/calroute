import { requireAdminApi } from '@/lib/admin-session'
import { getUserEngagementMetrics, getCalendarSyncStatus, getBookingRescheduleAnalytics } from '@/lib/engagement-metrics'
import { getFeatureUsageHeatmap, getFeatureAdoptionMetrics } from '@/lib/feature-tracking'


export async function GET(request: Request) {
  const adminCheck = await requireAdminApi(request)
  if (adminCheck instanceof Response) return adminCheck
  const user = adminCheck

  try {
    const [engagement, syncStatus, rescheduleAnalytics, featureHeatmap, featureAdoption] = await Promise.all([
      getUserEngagementMetrics(),
      getCalendarSyncStatus(),
      getBookingRescheduleAnalytics(),
      getFeatureUsageHeatmap(),
      getFeatureAdoptionMetrics(),
    ])

    return Response.json({
      engagement,
      syncStatus,
      rescheduleAnalytics,
      featureHeatmap,
      featureAdoption,
    })
  } catch (error) {
    console.error('[engagement] error:', error)
    return Response.json({ error: 'Failed to fetch engagement metrics' }, { status: 500 })
  }
}
