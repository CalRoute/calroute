import { emailLayout } from './layout'

export function billingPaymentFailedEmail(data: {
  name: string
  planName: string
  portalUrl: string
}): string {
  const content = `
    <h2>Payment failed</h2>
    <p>Hi ${data.name},</p>
    <p>We attempted to charge your payment method for your ${data.planName}, but the payment failed.</p>
    <p>To update your payment method and retry, please visit your <a href="${data.portalUrl}">billing portal</a>.</p>
    <p>If you continue to experience issues, please <a href="mailto:support@calroute.me">contact support</a>.</p>
  `
  return emailLayout(content)
}
