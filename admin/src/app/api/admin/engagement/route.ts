import { getAdminSession } from '@/lib/session'
import { getUserEngagementMetrics, getCalendarTokenHealth, getBookingRescheduleAnalytics } from '@/lib/engagement-metrics'
import { getFeatureUsageHeatmap, getFeatureAdoptionMetrics } from '@/lib/feature-tracking'


export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const user = { uid: session.uid, email: session.email }

  try {
    const [engagement, tokenHealth, rescheduleAnalytics, featureHeatmap, featureAdoption] = await Promise.all([
      getUserEngagementMetrics(),
      getCalendarTokenHealth(),
      getBookingRescheduleAnalytics(),
      getFeatureUsageHeatmap(),
      getFeatureAdoptionMetrics(),
    ])

    return Response.json({
      engagement,
      tokenHealth,
      rescheduleAnalytics,
      featureHeatmap,
      featureAdoption,
    })
  } catch (error) {
    console.error('[engagement] error:', error)
    return Response.json({ error: 'Failed to fetch engagement metrics' }, { status: 500 })
  }
}
