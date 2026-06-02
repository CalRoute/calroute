import { requireUser } from '@/lib/firebase/session'
import { getAllSlackIntegrations } from '@/lib/slack-integration'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

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
