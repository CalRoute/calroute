import { adminDb } from './firebase/admin'

export interface EmailTemplateMetric {
  templateId: string
  templateName: string
  sent: number
  opened: number
  clicked: number
  bounced: number
  openRate: number
  clickRate: number
}

export async function trackEmailSent(templateId: string, templateName: string, userId: string) {
  try {
    await adminDb.collection('email_metrics').add({
      templateId,
      templateName,
      userId,
      event: 'sent',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[email-metrics] error tracking sent:', error)
  }
}

export async function trackEmailOpened(templateId: string) {
  try {
    await adminDb.collection('email_metrics').add({
      templateId,
      event: 'opened',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[email-metrics] error tracking open:', error)
  }
}

export async function trackEmailClicked(templateId: string) {
  try {
    await adminDb.collection('email_metrics').add({
      templateId,
      event: 'clicked',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[email-metrics] error tracking click:', error)
  }
}

export async function trackEmailBounced(templateId: string) {
  try {
    await adminDb.collection('email_metrics').add({
      templateId,
      event: 'bounced',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[email-metrics] error tracking bounce:', error)
  }
}

export async function getEmailTemplateMetrics(): Promise<EmailTemplateMetric[]> {
  try {
    const snap = await adminDb.collection('email_metrics').get()
    const events = snap.docs.map(d => d.data() as any)

    // Group by template
    const byTemplate: Record<string, any> = {}

    events.forEach(event => {
      if (!byTemplate[event.templateId]) {
        byTemplate[event.templateId] = {
          templateId: event.templateId,
          templateName: event.templateName || event.templateId,
          sent: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
        }
      }

      if (event.event === 'sent') byTemplate[event.templateId].sent++
      if (event.event === 'opened') byTemplate[event.templateId].opened++
      if (event.event === 'clicked') byTemplate[event.templateId].clicked++
      if (event.event === 'bounced') byTemplate[event.templateId].bounced++
    })

    // Calculate rates
    return Object.values(byTemplate).map((template: any) => ({
      ...template,
      openRate: template.sent > 0 ? ((template.opened / template.sent) * 100).toFixed(1) : '0',
      clickRate: template.sent > 0 ? ((template.clicked / template.sent) * 100).toFixed(1) : '0',
    }))
  } catch (error) {
    console.error('[email-metrics] error getting metrics:', error)
    return []
  }
}

export async function getEmailTemplateComparison() {
  try {
    const metrics = await getEmailTemplateMetrics()

    return {
      totalSent: metrics.reduce((a, b) => a + b.sent, 0),
      totalOpened: metrics.reduce((a, b) => a + parseInt(String(b.opened)), 0),
      totalClicked: metrics.reduce((a, b) => a + parseInt(String(b.clicked)), 0),
      averageOpenRate:
        metrics.length > 0
          ? (metrics.reduce((a, b) => a + parseFloat(String(b.openRate)), 0) / metrics.length).toFixed(1)
          : '0',
      averageClickRate:
        metrics.length > 0
          ? (metrics.reduce((a, b) => a + parseFloat(String(b.clickRate)), 0) / metrics.length).toFixed(1)
          : '0',
      bestPerformer: metrics.sort((a, b) => parseFloat(String(b.openRate)) - parseFloat(String(a.openRate)))[0],
      templates: metrics,
    }
  } catch (error) {
    console.error('[email-metrics] error comparing:', error)
    return null
  }
}
