import { getAdminSession } from '@/lib/session'
import { getAllSlackIntegrations } from '@/lib/slack-integration'


export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const user = { uid: session.uid, email: session.email }

  try {
    const integrations = await getAllSlackIntegrations()

    // Calculate stats
    const stats = {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(i => i.isActive).length,
      notificationsEnabled: integrations.filter(i => i.notificationsEnabled).length,
    }

    return Response.json({ integrations, stats })
  } catch (error) {
    console.error('[slack] error:', error)
    return Response.json({ error: 'Failed to fetch Slack integrations' }, { status: 500 })
  }
}
