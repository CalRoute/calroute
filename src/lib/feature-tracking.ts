import { adminDb } from './firebase/admin'

export type FeatureName =
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'calendar_synced'
  | 'webhook_triggered'
  | 'api_key_used'
  | 'custom_email_template'
  | 'phone_call_booking'
  | 'team_link_created'
  | 'availability_checked'

export interface FeatureUsage {
  feature: FeatureName
  userId: string
  timestamp: string
  metadata?: Record<string, any>
}

export async function trackFeatureUsage(feature: FeatureName, userId: string, metadata?: Record<string, any>) {
  try {
    await adminDb.collection('feature_usage').add({
      feature,
      userId,
      timestamp: new Date().toISOString(),
      metadata,
    })
  } catch (error) {
    console.error('[feature] error tracking:', error)
  }
}

export async function getFeatureUsageHeatmap(days = 30) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const snap = await adminDb
      .collection('feature_usage')
      .where('timestamp', '>=', since.toISOString())
      .get()

    const data = snap.docs.map(d => d.data() as FeatureUsage)

    // Group by feature and date
    const heatmap: Record<string, Record<string, number>> = {}

    data.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      if (!heatmap[event.feature]) {
        heatmap[event.feature] = {}
      }
      heatmap[event.feature][date] = (heatmap[event.feature][date] || 0) + 1
    })

    return heatmap
  } catch (error) {
    console.error('[feature] error getting heatmap:', error)
    return {}
  }
}

export async function getFeatureAdoptionMetrics(days = 30) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const snap = await adminDb
      .collection('feature_usage')
      .where('timestamp', '>=', since.toISOString())
      .get()

    const data = snap.docs.map(d => d.data() as FeatureUsage)

    // Count by feature
    const adoption: Record<FeatureName, { count: number; uniqueUsers: Set<string> }> = {} as any

    data.forEach(event => {
      if (!adoption[event.feature]) {
        adoption[event.feature] = { count: 0, uniqueUsers: new Set() }
      }
      adoption[event.feature].count++
      adoption[event.feature].uniqueUsers.add(event.userId)
    })

    // Convert to readable format
    return Object.entries(adoption).map(([feature, data]) => ({
      feature,
      totalUsage: data.count,
      adoptingUsers: data.uniqueUsers.size,
      adoptionRate: data.uniqueUsers.size > 0 ? (data.count / data.uniqueUsers.size).toFixed(2) : '0',
    }))
  } catch (error) {
    console.error('[feature] error getting adoption:', error)
    return []
  }
}
