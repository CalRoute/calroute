import { emailLayout } from './layout'

export function billingCouponRevokedEmail(data: {
  name: string
  newMonthlyAmount: string
}): string {
  const content = `
    <h2>Your team discount has ended</h2>
    <p>Hi ${data.name},</p>
    <p>You were recently removed from a team. Your Solo plan discount has been removed.</p>
    <p>Your new monthly cost is <strong>${data.newMonthlyAmount}</strong>, effective immediately.</p>
    <p>You can manage your subscription in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings">account settings</a>.</p>
  `
  return emailLayout(content)
}
