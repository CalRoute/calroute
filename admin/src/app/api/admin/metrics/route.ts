import { getAdminSession } from '@/lib/session'
import { getApiMetrics, getAverageLatenessBy } from '@/lib/api-metrics'


export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const user = { uid: session.uid, email: session.email }

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
