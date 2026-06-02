import { adminDb } from './firebase/admin'

export interface SlackIntegration {
  userId: string
  slackWorkspaceId: string
  slackTeamName: string
  botToken: string
  channelId: string
  channelName: string
  notificationsEnabled: boolean
  notifyOn: ('booking_created' | 'booking_cancelled' | 'booking_rescheduled')[]
  createdAt: string
  isActive: boolean
}

export async function saveSlackIntegration(userId: string, integration: Omit<SlackIntegration, 'userId' | 'createdAt'>) {
  try {
    await adminDb.collection('slack_integrations').doc(userId).set({
      userId,
      ...integration,
      createdAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('[slack] error saving integration:', error)
    return false
  }
}

export async function getSlackIntegration(userId: string): Promise<SlackIntegration | null> {
  try {
    const snap = await adminDb.collection('slack_integrations').doc(userId).get()
    return (snap.data() as SlackIntegration) || null
  } catch (error) {
    console.error('[slack] error getting integration:', error)
    return null
  }
}

export async function deleteSlackIntegration(userId: string) {
  try {
    await adminDb.collection('slack_integrations').doc(userId).delete()
    return true
  } catch (error) {
    console.error('[slack] error deleting integration:', error)
    return false
  }
}

export async function getAllSlackIntegrations() {
  try {
    const snap = await adminDb.collection('slack_integrations').get()
    return snap.docs.map(d => d.data() as SlackIntegration)
  } catch (error) {
    console.error('[slack] error getting all integrations:', error)
    return []
  }
}

export async function sendSlackNotification(
  userId: string,
  event: 'booking_created' | 'booking_cancelled' | 'booking_rescheduled',
  details: Record<string, any>
) {
  try {
    const integration = await getSlackIntegration(userId)

    if (!integration || !integration.isActive || !integration.notificationsEnabled) {
      return false
    }

    if (!integration.notifyOn.includes(event)) {
      return false
    }

    // Send to Slack API (implementation would depend on your Slack setup)
    // This is a placeholder for the actual Slack API call
    console.log(`[slack] sending ${event} notification to user ${userId}`)

    return true
  } catch (error) {
    console.error('[slack] error sending notification:', error)
    return false
  }
}
