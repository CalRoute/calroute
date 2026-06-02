import { requireUser } from '@/lib/firebase/session'
import { getApiMetrics, getAverageLatenessBy } from '@/lib/api-metrics'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const hours = parseInt(searchParams.get('hours') || '24')

  try {
    const { metrics, stats } = await getApiMetrics(hours)
    const lateness = await getAverageLatenessBy('endpoint')

    return Response.json({
      metrics,
      stats,
      lateness,
      timeRange: `Last ${hours} hours`,
    })
  } catch (error) {
    console.error('[metrics] error:', error)
    return Response.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
