import { emailLayout } from './layout'

interface SubscriptionConfirmedData {
  name: string
  planName: string
  dashboardUrl: string
}

export function billingSubscriptionConfirmedEmail(data: SubscriptionConfirmedData): string {
  const { name, planName, dashboardUrl } = data

  const features =
    planName === 'Team'
      ? `
      <ul>
        <li><strong>Everything in Solo</strong> plus:</li>
        <li>Multi-host booking links with automatic routing</li>
        <li>Add unlimited team members at $2 per person per month</li>
        <li>Real-time team availability</li>
        <li>Team dashboard and member management</li>
      </ul>
    `
      : `
      <ul>
        <li>Unlimited booking links</li>
        <li>Custom email templates</li>
        <li>Full analytics and reports</li>
        <li>Webhooks & REST API access</li>
        <li>Email and phone support</li>
      </ul>
    `

  const content = `
    <h2>Welcome to CalRoute${planName ? ` ${planName}` : ''}!</h2>
    <p>Hi ${name},</p>
    <p>Your subscription is confirmed and ready to go. Here's what you can now do:</p>
    ${features}
    <p>${planName === 'Team' ? 'You can start adding team members to your booking links right away from your link settings. Your team members get premium routing at no extra charge, and they can also upgrade their own Solo plan at 50% off.' : 'Start creating unlimited booking links and take full advantage of CalRoute\'s scheduling and analytics tools.'}</p>
    <p><a href="${dashboardUrl}"><strong>Go to your dashboard →</strong></a></p>
    <hr />
    <p style="font-size: 12px; color: #999; margin-top: 32px;">Questions? Reply to this email or visit <a href="https://calroute.me/support">our support page</a>.</p>
  `

  return emailLayout(content)
}
