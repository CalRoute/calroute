import { requireUser } from '@/lib/firebase/session'
import { getUserEngagementMetrics, getCalendarSyncStatus, getBookingRescheduleAnalytics } from '@/lib/engagement-metrics'
import { getFeatureUsageHeatmap, getFeatureAdoptionMetrics } from '@/lib/feature-tracking'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

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
