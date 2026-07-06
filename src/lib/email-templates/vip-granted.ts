import { emailLayout } from './layout'

export function vipGrantedEmail(data: {
  name: string
  appUrl: string
}): string {
  const firstName = data.name.split(' ')[0]
  const content = `
    <h2>You're a VIP now, ${firstName}! ⭐</h2>
    <p>We've upgraded your account to full VIP access, completely on us. Unlimited booking links, API access, team features, everything.</p>
    <p>No catch, no expiry. Just enjoy it.</p>
    <a class="button" href="${data.appUrl}/dashboard">Go explore →</a>
    <hr />
    <p class="actions">Questions about your account? Reply here anytime.</p>
  `
  return emailLayout(content, `${firstName}, you've been granted VIP access to CalRoute ⭐`)
}

export function vipRevokedEmail(data: {
  name: string
  appUrl: string
}): string {
  const firstName = data.name.split(' ')[0]
  const content = `
    <h2>A quick note about your account, ${firstName}</h2>
    <p>Your complimentary VIP access has been removed. Your account is back on the free trial for now.</p>
    <p>If you'd like to keep full access, you can upgrade to a plan that works for you. Solo is $10/month flat.</p>
    <a class="button" href="${data.appUrl}/dashboard/settings?tab=billing">See plans →</a>
    <hr />
    <p class="actions">Have questions? Just reply. We're happy to help.</p>
  `
  return emailLayout(content, 'An update to your CalRoute account')
}
